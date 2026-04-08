import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// ========================================
// HELPER: Calculer les depenses pub journalieres recurrentes
// Chaque entree = "a partir de cette date, le budget journalier est X"
// Le budget reste actif jusqu'a ce qu'une nouvelle entree le remplace
// ========================================

function computeDailyAdSpend(allBudgets, startDate, endDate) {
  // Grouper par (productId, platform)
  const groups = {};
  for (const b of allBudgets) {
    const key = `${b.productId ?? 'null'}_${b.platform}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  // Trier chaque groupe par date ASC
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  let totalPub = 0;
  const pubParProduit = {};
  const pubParPlateforme = {};
  const pubParJour = {};

  const tempDate = new Date(startDate);
  while (tempDate <= endDate) {
    const dateStr = tempDate.toISOString().split('T')[0];
    let dayTotal = 0;

    for (const [, budgets] of Object.entries(groups)) {
      let active = null;
      for (let i = budgets.length - 1; i >= 0; i--) {
        if (new Date(budgets[i].date) <= tempDate) {
          active = budgets[i];
          break;
        }
      }
      if (active && active.montant > 0) {
        dayTotal += active.montant;
        const pid = active.productId ?? 0;
        pubParProduit[pid] = (pubParProduit[pid] || 0) + active.montant;
        pubParPlateforme[active.platform] = (pubParPlateforme[active.platform] || 0) + active.montant;
      }
    }

    pubParJour[dateStr] = dayTotal;
    totalPub += dayTotal;
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
  }

  // Budgets actifs actuellement (dernier par groupe avec montant > 0)
  const budgetsActifs = [];
  for (const [, budgets] of Object.entries(groups)) {
    const latest = budgets[budgets.length - 1];
    if (latest && latest.montant > 0) {
      budgetsActifs.push({
        id: latest.id,
        productId: latest.productId,
        productNom: latest.product?.nom || 'Tous produits',
        platform: latest.platform,
        montantJournalier: latest.montant,
        depuis: latest.date,
        note: latest.note,
      });
    }
  }

  return { totalPub, pubParProduit, pubParPlateforme, pubParJour, budgetsActifs };
}

// ========================================
// STATS COMPTABLES
// ========================================

router.get('/stats', async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    const companyId = req.user.companyId;

    let startDate, endDate;
    if (dateDebut) {
      startDate = new Date(`${dateDebut}T00:00:00.000Z`);
    } else {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    }
    if (dateFin) {
      endDate = new Date(`${dateFin}T23:59:59.999Z`);
    } else {
      const now = new Date();
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    }

    const config = await prisma.accountingConfig.findUnique({ where: { companyId } });
    const commissionParLivraison = config?.commissionLivreurLocal || 1500;

    // Charger TOUS les budgets pub (pas uniquement la periode)
    // car un budget defini avant la periode reste actif pendant
    const [commandes, allAdBudgets, purchases] = await Promise.all([
      prisma.order.findMany({
        where: {
          companyId,
          OR: [
            { deliveryType: 'LOCAL', status: 'LIVREE', deliveredAt: { gte: startDate, lte: endDate } },
            { deliveryType: 'EXPEDITION', status: 'EXPEDITION', expedieAt: { gte: startDate, lte: endDate } },
            { deliveryType: 'EXPRESS', status: 'EXPRESS', expedieAt: { gte: startDate, lte: endDate } },
            { deliveryType: 'EXPRESS', status: { in: ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE'] }, arriveAt: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          product: { select: { id: true, nom: true, code: true } },
          deliverer: { select: { nom: true, prenom: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adExpense.findMany({
        where: { companyId },
        include: { product: { select: { id: true, nom: true, code: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.supplierPurchase.findMany({
        where: { companyId, date: { gte: startDate, lte: endDate } },
        include: { product: { select: { id: true, nom: true, code: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);

    // REVENUS
    const livraisonsLocales = commandes.filter((c) => c.deliveryType === 'LOCAL' && c.status === 'LIVREE');
    const expeditions = commandes.filter((c) => c.deliveryType === 'EXPEDITION' && c.status === 'EXPEDITION');
    const expressAvance = commandes.filter((c) => c.deliveryType === 'EXPRESS' && c.status === 'EXPRESS');
    const expressRetrait = commandes.filter((c) => c.deliveryType === 'EXPRESS' && ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(c.status));

    const revenuLocal = livraisonsLocales.reduce((s, c) => s + c.montant, 0);
    const revenuExpedition = expeditions.reduce((s, c) => s + c.montant, 0);
    const revenuExpressAv = expressAvance.reduce((s, c) => s + c.montant * 0.1, 0);
    const revenuExpressRet = expressRetrait.reduce((s, c) => s + c.montant * 0.9, 0);
    const revenuTotal = revenuLocal + revenuExpedition + revenuExpressAv + revenuExpressRet;

    // DEPENSES PUB (recurrentes journalieres)
    const { totalPub, pubParProduit, pubParPlateforme, pubParJour, budgetsActifs } =
      computeDailyAdSpend(allAdBudgets, startDate, endDate);

    const totalAchats = purchases.reduce((s, p) => s + p.coutTotalRevient, 0);
    const totalCommissionsLivreur = livraisonsLocales.length * commissionParLivraison;
    const totalDepenses = totalPub + totalAchats + totalCommissionsLivreur;

    // MARGE
    const margeNette = revenuTotal - totalDepenses;
    const margePourcent = revenuTotal > 0 ? ((margeNette / revenuTotal) * 100).toFixed(1) : 0;

    // Par produit
    const parProduit = {};
    for (const c of commandes) {
      const pid = c.product?.id || 0;
      const pnom = c.product?.nom || c.produitNom || 'Inconnu';
      if (!parProduit[pid]) {
        parProduit[pid] = { id: pid, nom: pnom, revenu: 0, nbVentes: 0, pub: 0, achats: 0, commissions: 0 };
      }
      if (c.deliveryType === 'LOCAL' && c.status === 'LIVREE') {
        parProduit[pid].revenu += c.montant;
        parProduit[pid].commissions += commissionParLivraison;
      } else if (c.deliveryType === 'EXPEDITION') {
        parProduit[pid].revenu += c.montant;
      } else if (c.deliveryType === 'EXPRESS' && c.status === 'EXPRESS') {
        parProduit[pid].revenu += c.montant * 0.1;
      } else if (['EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(c.status)) {
        parProduit[pid].revenu += c.montant * 0.9;
      }
      parProduit[pid].nbVentes++;
    }
    // Attribution pub par produit (calculee par le helper)
    for (const [pidStr, montant] of Object.entries(pubParProduit)) {
      const pid = parseInt(pidStr);
      if (parProduit[pid]) parProduit[pid].pub += montant;
    }
    for (const p of purchases) {
      const pid = p.productId || 0;
      if (parProduit[pid]) parProduit[pid].achats += p.coutTotalRevient;
    }
    const produits = Object.values(parProduit).map((p) => ({
      ...p,
      marge: p.revenu - p.pub - p.achats - p.commissions,
      margePourcent: p.revenu > 0 ? (((p.revenu - p.pub - p.achats - p.commissions) / p.revenu) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.revenu - a.revenu);

    // Evolution journaliere
    const evolutionJournaliere = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const jourDebut = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 0, 0, 0, 0));
      const jourFin = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 23, 59, 59, 999));
      const dateStr = jourDebut.toISOString().split('T')[0];

      const cJour = commandes.filter((c) => {
        const d = c.deliveredAt || c.expedieAt || c.arriveAt;
        return d >= jourDebut && d <= jourFin;
      });
      const localJour = cJour.filter((c) => c.deliveryType === 'LOCAL' && c.status === 'LIVREE');
      const revJour = localJour.reduce((s, c) => s + c.montant, 0)
        + cJour.filter((c) => c.deliveryType === 'EXPEDITION').reduce((s, c) => s + c.montant, 0)
        + cJour.filter((c) => c.deliveryType === 'EXPRESS' && c.status === 'EXPRESS').reduce((s, c) => s + c.montant * 0.1, 0)
        + cJour.filter((c) => ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(c.status)).reduce((s, c) => s + c.montant * 0.9, 0);

      const pubJourMontant = pubParJour[dateStr] || 0;
      const commJour = localJour.length * commissionParLivraison;

      evolutionJournaliere.push({
        date: dateStr,
        revenu: revJour,
        pub: pubJourMontant,
        commissions: commJour,
        marge: revJour - pubJourMontant - commJour,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Top livreurs
    const livreurStats = {};
    livraisonsLocales.forEach((c) => {
      if (c.deliverer) {
        const key = `${c.deliverer.prenom} ${c.deliverer.nom}`;
        if (!livreurStats[key]) livreurStats[key] = { nom: key, montant: 0, nombre: 0, commission: 0 };
        livreurStats[key].montant += c.montant;
        livreurStats[key].nombre++;
        livreurStats[key].commission += commissionParLivraison;
      }
    });
    const topLivreurs = Object.values(livreurStats).sort((a, b) => b.montant - a.montant);

    // Nombre de jours dans la periode
    const nbJours = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const budgetJournalierTotal = budgetsActifs.reduce((s, b) => s + b.montantJournalier, 0);

    // Conseils business
    const conseils = [];
    if (margePourcent < 20 && revenuTotal > 0) conseils.push({ type: 'warning', text: 'Marge nette faible (<20%). Revoyez vos prix de vente ou reduisez les depenses pub.' });
    if (totalPub > revenuTotal * 0.4 && revenuTotal > 0) conseils.push({ type: 'danger', text: 'Depenses pub > 40% du CA. Le cout d\'acquisition client est trop eleve.' });
    if (totalCommissionsLivreur > revenuTotal * 0.15 && revenuTotal > 0) conseils.push({ type: 'info', text: 'Les commissions livreurs representent plus de 15% du CA. Envisagez un systeme de tournees optimisees.' });
    const produitsDeficitaires = produits.filter((p) => p.marge < 0);
    if (produitsDeficitaires.length > 0) {
      conseils.push({ type: 'danger', text: `${produitsDeficitaires.length} produit(s) deficitaire(s): ${produitsDeficitaires.map((p) => p.nom).join(', ')}. Arretez la pub ou augmentez le prix.` });
    }
    const produitsSansPub = produits.filter((p) => p.pub === 0 && p.nbVentes > 0);
    if (produitsSansPub.length > 0) {
      conseils.push({ type: 'success', text: `${produitsSansPub.length} produit(s) generent du revenu sans pub: ${produitsSansPub.map((p) => p.nom).slice(0, 3).join(', ')}. Vos meilleurs produits organiques!` });
    }
    if (revenuTotal > 0 && totalPub > 0) {
      const roas = revenuTotal / totalPub;
      conseils.push({ type: roas >= 3 ? 'success' : roas >= 2 ? 'info' : 'warning', text: `ROAS (Return On Ad Spend): ${roas.toFixed(1)}x. ${roas >= 3 ? 'Excellent!' : roas >= 2 ? 'Correct, peut etre ameliore.' : 'Faible, optimisez vos campagnes.'}` });
    }

    res.json({
      periode: { debut: startDate.toISOString(), fin: endDate.toISOString() },
      revenus: {
        local: { montant: revenuLocal, nombre: livraisonsLocales.length },
        expedition: { montant: revenuExpedition, nombre: expeditions.length },
        expressAvance: { montant: revenuExpressAv, nombre: expressAvance.length },
        expressRetrait: { montant: revenuExpressRet, nombre: expressRetrait.length },
        total: revenuTotal,
        totalCommandes: commandes.length,
      },
      depenses: {
        pub: {
          total: totalPub,
          parPlateforme: pubParPlateforme,
          budgetsActifs,
          budgetJournalierTotal,
          nbJours,
        },
        achats: { total: totalAchats, details: purchases },
        commissions: { total: totalCommissionsLivreur, parLivraison: commissionParLivraison, nbLivraisons: livraisonsLocales.length },
        total: totalDepenses,
      },
      marge: { nette: margeNette, pourcentage: parseFloat(margePourcent) },
      parProduit: produits,
      evolutionJournaliere,
      topLivreurs,
      conseils,
      config: { commissionLivreurLocal: commissionParLivraison },
    });
  } catch (error) {
    console.error('Erreur stats comptables:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des statistiques.' });
  }
});

// ========================================
// BUDGETS PUBLICITAIRES (recurrents journaliers)
// ========================================

router.get('/ad-expenses', async (req, res) => {
  try {
    const expenses = await prisma.adExpense.findMany({
      where: { companyId: req.user.companyId },
      include: { product: { select: { id: true, nom: true, code: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ expenses });
  } catch (error) {
    console.error('Erreur ad-expenses:', error);
    res.status(500).json({ error: 'Erreur recuperation budgets pub.' });
  }
});

router.post('/ad-expenses', async (req, res) => {
  try {
    const { productId, date, platform, montant, note } = req.body;
    if (!date || !platform || montant === undefined) {
      return res.status(400).json({ error: 'date, platform et montant sont obligatoires.' });
    }
    const expense = await prisma.adExpense.create({
      data: {
        productId: productId ? parseInt(productId) : null,
        date: new Date(date),
        platform: platform.toUpperCase(),
        montant: parseFloat(montant),
        note: note || null,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      },
      include: { product: { select: { id: true, nom: true } } },
    });
    res.status(201).json({ expense });
  } catch (error) {
    console.error('Erreur creation budget pub:', error);
    res.status(500).json({ error: 'Erreur creation budget pub.' });
  }
});

router.put('/ad-expenses/:id', async (req, res) => {
  try {
    const { productId, date, platform, montant, note } = req.body;
    const expense = await prisma.adExpense.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(productId !== undefined && { productId: productId ? parseInt(productId) : null }),
        ...(date && { date: new Date(date) }),
        ...(platform && { platform: platform.toUpperCase() }),
        ...(montant !== undefined && { montant: parseFloat(montant) }),
        ...(note !== undefined && { note }),
      },
      include: { product: { select: { id: true, nom: true } } },
    });
    res.json({ expense });
  } catch (error) {
    console.error('Erreur update budget pub:', error);
    res.status(500).json({ error: 'Erreur mise a jour budget pub.' });
  }
});

router.delete('/ad-expenses/:id', async (req, res) => {
  try {
    await prisma.adExpense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur delete budget pub:', error);
    res.status(500).json({ error: 'Erreur suppression budget pub.' });
  }
});

// ========================================
// ACHATS FOURNISSEUR
// ========================================

router.get('/purchases', async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const where = { companyId: req.user.companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (productId) where.productId = parseInt(productId);

    const purchases = await prisma.supplierPurchase.findMany({
      where,
      include: { product: { select: { id: true, nom: true, code: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ purchases });
  } catch (error) {
    console.error('Erreur purchases:', error);
    res.status(500).json({ error: 'Erreur recuperation achats.' });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const { productId, date, fournisseur, quantite, prixUnitaire, fraisDedouanement, fraisTransport, autreFrais, note } = req.body;
    if (!date || !fournisseur || !quantite || !prixUnitaire) {
      return res.status(400).json({ error: 'date, fournisseur, quantite et prixUnitaire sont obligatoires.' });
    }
    const qty = parseInt(quantite);
    const pu = parseFloat(prixUnitaire);
    const prixTotal = qty * pu;
    const dedouane = parseFloat(fraisDedouanement || 0);
    const transport = parseFloat(fraisTransport || 0);
    const autres = parseFloat(autreFrais || 0);
    const coutTotal = prixTotal + dedouane + transport + autres;

    const purchase = await prisma.supplierPurchase.create({
      data: {
        productId: productId ? parseInt(productId) : null,
        date: new Date(date),
        fournisseur,
        quantite: qty,
        prixUnitaire: pu,
        prixTotal,
        fraisDedouanement: dedouane,
        fraisTransport: transport,
        autreFrais: autres,
        coutTotalRevient: coutTotal,
        note: note || null,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      },
      include: { product: { select: { id: true, nom: true } } },
    });
    res.status(201).json({ purchase });
  } catch (error) {
    console.error('Erreur creation purchase:', error);
    res.status(500).json({ error: 'Erreur creation achat fournisseur.' });
  }
});

router.delete('/purchases/:id', async (req, res) => {
  try {
    await prisma.supplierPurchase.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur delete purchase:', error);
    res.status(500).json({ error: 'Erreur suppression achat.' });
  }
});

// ========================================
// CONFIG COMPTABILITE
// ========================================

router.get('/config', async (req, res) => {
  try {
    let config = await prisma.accountingConfig.findUnique({ where: { companyId: req.user.companyId } });
    if (!config) {
      config = await prisma.accountingConfig.create({
        data: { companyId: req.user.companyId, commissionLivreurLocal: 1500 },
      });
    }
    res.json({ config });
  } catch (error) {
    console.error('Erreur config:', error);
    res.status(500).json({ error: 'Erreur recuperation config.' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const { commissionLivreurLocal } = req.body;
    const config = await prisma.accountingConfig.upsert({
      where: { companyId: req.user.companyId },
      update: { commissionLivreurLocal: parseFloat(commissionLivreurLocal) },
      create: { companyId: req.user.companyId, commissionLivreurLocal: parseFloat(commissionLivreurLocal) },
    });
    res.json({ config });
  } catch (error) {
    console.error('Erreur update config:', error);
    res.status(500).json({ error: 'Erreur mise a jour config.' });
  }
});

export default router;
