import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { notifyOrderAssigned, notifyDeliveryListCreated } from '../utils/notifications.js';
import { excludeIsolatedProductsFilter, ISOLATED_PRODUCT_CODES } from '../utils/isolatedProducts.js';

const router = express.Router();

router.use(authenticate);

// GET /api/delivery/lists - Liste des listes de livraison (Admin/Gestionnaire/Stock/Appelant)
router.get('/lists', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'), async (req, res) => {
  try {
    // 🧹 Nettoyage automatique des photos expirées (silencieux)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      await prisma.order.updateMany({
        where: {
          companyId: req.user.companyId,
          photoRecuExpedition: { not: null },
          photoRecuExpeditionUploadedAt: { lt: sevenDaysAgo }
        },
        data: {
          photoRecuExpedition: null,
          photoRecuExpeditionUploadedAt: null
        }
      });
    } catch (cleanupError) {
      console.error('⚠️ Erreur nettoyage photos:', cleanupError);
      // Ne pas bloquer la requête principale
    }

    const { delivererId, startDate, endDate } = req.query;

    const where = { companyId: req.user.companyId };
    if (delivererId) where.delivererId = parseInt(delivererId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const lists = await prisma.deliveryList.findMany({
      where,
      include: {
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        orders: {
          select: {
            id: true,
            orderReference: true,
            clientNom: true,
            clientTelephone: true,
            clientVille: true,
            clientAdresse: true,
            produitNom: true,
            montant: true,
            status: true,
            deliveryType: true,
            codeExpedition: true,
            photoRecuExpedition: true,
            photoRecuExpeditionUploadedAt: true,
            expedieAt: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ lists });
  } catch (error) {
    console.error('Erreur récupération listes de livraison:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des listes de livraison.' });
  }
});

// POST /api/delivery/assign - Assigner des commandes à un livreur (Gestionnaire/Admin)
router.post('/assign', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { orderIds, delivererId, deliveryDate, listName, zone } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Liste de commandes invalide.' });
    }

    if (!delivererId) {
      return res.status(400).json({ error: 'Livreur requis.' });
    }

    // Vérifier que le livreur existe et a le bon rôle
    const deliverer = await prisma.user.findUnique({
      where: { id: parseInt(delivererId) }
    });

    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    // Vérifier qu'aucune des commandes n'est une EXPEDITION ou EXPRESS
    const ordersToAssign = await prisma.order.findMany({
      where: {
        companyId: req.user.companyId,
        id: { in: orderIds.map(id => parseInt(id)) }
      },
      include: { product: { select: { code: true } } },
    });

    const isolatedOrders = ordersToAssign.filter((o) =>
      ISOLATED_PRODUCT_CODES.includes(String(o.product?.code || '').toUpperCase()),
    );
    if (isolatedOrders.length > 0) {
      return res.status(400).json({
        error: 'Ces commandes sont gérées sur bouilloire-commandes, pas dans obgestion.',
      });
    }

    const invalidOrders = ordersToAssign.filter(o => o.deliveryType === 'EXPEDITION' || o.deliveryType === 'EXPRESS');
    if (invalidOrders.length > 0) {
      return res.status(400).json({ 
        error: `${invalidOrders.length} commande(s) EXPEDITION/EXPRESS détectée(s). Utilisez la route d'assignation spécifique pour ces commandes.` 
      });
    }

    // Créer la liste de livraison
    const deliveryList = await prisma.deliveryList.create({
      data: {
        companyId: req.user.companyId,
        nom: listName || `Livraison ${new Date(deliveryDate).toLocaleDateString('fr-FR')}`,
        date: new Date(deliveryDate),
        delivererId: parseInt(delivererId),
        zone: zone || null
      }
    });

    // Assigner les commandes
    const updatePromises = orderIds.map(orderId =>
      prisma.order.update({
        where: { id: parseInt(orderId), companyId: req.user.companyId },
        data: {
          delivererId: parseInt(delivererId),
          deliveryListId: deliveryList.id,
          deliveryDate: new Date(deliveryDate),
          status: 'ASSIGNEE'
        }
      })
    );

    await Promise.all(updatePromises);

    // Créer l'historique pour chaque commande
    const historyPromises = orderIds.map(orderId =>
      prisma.statusHistory.create({
        data: {
          orderId: parseInt(orderId),
          oldStatus: 'VALIDEE',
          newStatus: 'ASSIGNEE',
          changedBy: req.user.id,
          comment: `Assignée au livreur ${deliverer.prenom} ${deliverer.nom} pour le ${new Date(deliveryDate).toLocaleDateString('fr-FR')}`
        }
      })
    );

    await Promise.all(historyPromises);

    // 🔔 Envoyer les notifications
    try {
      // Notifier le livreur de la nouvelle tournée
      notifyDeliveryListCreated(deliveryList, deliverer, orderIds.length);
      
      // Notifier pour chaque commande assignée
      const assignedOrders = await prisma.order.findMany({
        where: { companyId: req.user.companyId, id: { in: orderIds.map(id => parseInt(id)) } }
      });
      
      assignedOrders.forEach(order => {
        notifyOrderAssigned(order, deliverer);
      });
    } catch (notifError) {
      console.error('⚠️ Erreur envoi notification:', notifError);
      // Ne pas bloquer l'assignation si la notification échoue
    }

    res.json({ 
      deliveryList, 
      message: `${orderIds.length} commande(s) assignée(s) avec succès.` 
    });
  } catch (error) {
    console.error('Erreur assignation commandes:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation des commandes.' });
  }
});

// GET /api/delivery/my-orders - Commandes du livreur connecté
router.get('/my-orders', authorize('LIVREUR'), async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = {
      companyId: req.user.companyId,
      delivererId: req.user.id,
      deliveryType: 'LOCAL' // ✅ Exclure EXPEDITION (gérées séparément dans le frontend)
    };

    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.deliveryDate = {
        gte: selectedDate,
        lt: nextDay
      };
    }

    if (status) {
      where.status = status;
    }

    // RÈGLE MÉTIER IMPORTANTE :
    // Le livreur ne doit voir que les commandes dont la remise a été confirmée
    // par le gestionnaire de stock (tourneeStock.colisRemisConfirme = true)
    const orders = await prisma.order.findMany({
      where,
      orderBy: { deliveryDate: 'desc' },
      include: {
        deliveryList: {
          include: {
            tourneeStock: true
          }
        }
      }
    });

    // Filtrer pour ne garder que les commandes avec remise confirmée
    const ordersWithConfirmedRemise = orders.filter(order => {
      // Si pas de deliveryList, ne pas afficher
      if (!order.deliveryList) return false;
      
      // Si pas de tourneeStock, ne pas afficher (remise pas encore confirmée)
      if (!order.deliveryList.tourneeStock) return false;
      
      // ✅ INCLURE les EXPEDITION (le livreur doit les voir après REMISE confirmée)
      // Les EXPEDITION passent par le système de REMISE pour la traçabilité
      // Pas de RETOUR car le client a déjà payé 100%
      
      // Ne montrer que si la remise est confirmée
      return order.deliveryList.tourneeStock.colisRemisConfirme === true;
    });

    res.json({ orders: ordersWithConfirmedRemise });
  } catch (error) {
    console.error('Erreur récupération commandes livreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

// ========================================
// BILAN DE JOURNÉE LIVREUR + DÉPÔT (commission 1500 F / livraison)
// ========================================

// Résumé calculé à la volée depuis orders : livraisons du jour (LIVREE +
// LIVREE_PARTIELLE au prorata), commission au taux courant, net attendu.
// Jamais de montant fourni par le client : tout est recalculé serveur.
async function computeLivreurDaySummary(companyId, livreurId, dayStr) {
  const gte = new Date(`${dayStr}T00:00:00.000Z`);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);

  const [orders, config] = await Promise.all([
    prisma.order.findMany({
      where: {
        companyId,
        delivererId: livreurId,
        status: { in: ['LIVREE', 'LIVREE_PARTIELLE'] },
        deliveredAt: { gte, lt },
      },
      select: { montant: true, quantite: true, quantiteLivree: true, status: true },
    }),
    prisma.accountingConfig.findUnique({ where: { companyId } }),
  ]);

  const commissionParLivraison = config?.commissionLivreurLocal || 1500;
  const nbLivraisons = orders.length;
  const nbPartielles = orders.filter((o) => o.status === 'LIVREE_PARTIELLE').length;
  const montantCollecte = orders.reduce((s, o) => {
    if (o.status === 'LIVREE_PARTIELLE') {
      const qte = o.quantite || 1;
      const livree = o.quantiteLivree ?? qte;
      return s + (o.montant * livree) / qte;
    }
    return s + o.montant;
  }, 0);
  const totalCommission = nbLivraisons * commissionParLivraison;
  const montantAttendu = montantCollecte - totalCommission;

  return { nbLivraisons, nbPartielles, montantCollecte, commissionParLivraison, totalCommission, montantAttendu };
}

// GET /api/delivery/my-day-summary?date=YYYY-MM-DD - Bilan du jour du livreur (LIVREUR)
router.get('/my-day-summary', authorize('LIVREUR'), async (req, res) => {
  try {
    const dayStr = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '')
      ? req.query.date
      : new Date().toISOString().slice(0, 10); // Abidjan = UTC

    const summary = await computeLivreurDaySummary(req.user.companyId, req.user.id, dayStr);

    // Dépôt existant pour cette date (s'il existe)
    const deposit = await prisma.livreurDeposit.findUnique({
      where: {
        company_livreur_date: {
          companyId: req.user.companyId,
          livreurId: req.user.id,
          date: new Date(`${dayStr}T00:00:00.000Z`),
        },
      },
    });

    res.json({ ...summary, deposit: deposit || null });
  } catch (error) {
    console.error('Erreur bilan journée livreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du bilan de journée.' });
  }
});

// POST /api/delivery/my-deposit - Déclarer son dépôt de fin de journée (LIVREUR)
router.post('/my-deposit', authorize('LIVREUR'), async (req, res) => {
  try {
    const { date, montantDepose } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) requise.' });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) {
      return res.status(400).json({ error: 'La date ne peut pas être dans le futur.' });
    }
    const montant = parseFloat(montantDepose);
    if (isNaN(montant) || montant < 0) {
      return res.status(400).json({ error: 'montantDepose doit être un nombre ≥ 0.' });
    }

    const dayDate = new Date(`${date}T00:00:00.000Z`);
    const uniqueWhere = {
      companyId: req.user.companyId,
      livreurId: req.user.id,
      date: dayDate,
    };

    // Un dépôt déjà vérifié par l'admin est verrouillé
    const existing = await prisma.livreurDeposit.findUnique({
      where: { company_livreur_date: uniqueWhere },
    });
    if (existing?.statut === 'VERIFIE') {
      return res.status(409).json({ error: 'Dépôt déjà vérifié : modification impossible.' });
    }

    // Résumé recalculé serveur (jamais de confiance au client pour les montants)
    const summary = await computeLivreurDaySummary(req.user.companyId, req.user.id, date);
    const data = {
      nbLivraisons: summary.nbLivraisons,
      montantCollecte: summary.montantCollecte,
      commissionParLivraison: summary.commissionParLivraison,
      totalCommission: summary.totalCommission,
      montantAttendu: summary.montantAttendu,
      montantDepose: montant,
      ecart: montant - summary.montantAttendu,
      statut: 'DECLARE',
    };

    const deposit = await prisma.livreurDeposit.upsert({
      where: { company_livreur_date: uniqueWhere },
      create: { ...uniqueWhere, ...data },
      update: data,
    });

    res.status(201).json({ deposit, summary });
  } catch (error) {
    console.error('Erreur dépôt livreur:', error);
    res.status(500).json({ error: 'Erreur lors de la déclaration du dépôt.' });
  }
});

// GET /api/delivery/validated-orders - Commandes validées en attente d'assignation (Gestionnaire/Admin)
router.get('/validated-orders', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { ville, startDate, endDate } = req.query;

    const where = {
      companyId: req.user.companyId,
      status: 'VALIDEE',
      delivererId: null,
      AND: [excludeIsolatedProductsFilter],
    };

    if (ville) {
      where.clientVille = { contains: ville, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.validatedAt = {};
      if (startDate) where.validatedAt.gte = new Date(startDate);
      if (endDate) where.validatedAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { validatedAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Erreur récupération commandes validées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes validées.' });
  }
});

export default router;

