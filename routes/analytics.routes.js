import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// GET /api/analytics/products - Statistiques détaillées des produits
router.get('/products', authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, deliveryType } = req.query;

    // Construire les filtres
    // IMPORTANT: on inclut aussi les anciennes commandes (productId null) via produitNom
    const whereClause = {
      companyId: req.user.companyId,
    };

    // Helpers dates: les inputs <input type="date"> arrivent en YYYY-MM-DD.
    // On veut inclure TOUTE la journée sélectionnée:
    // - startDate: >= YYYY-MM-DD 00:00:00Z
    // - endDate:   < (YYYY-MM-DD + 1 jour) 00:00:00Z  (évite le bug lte à minuit)
    const parseUtcDayStart = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);
    const parseUtcNextDayStart = (dateStr) => {
      const d = parseUtcDayStart(dateStr);
      d.setUTCDate(d.getUTCDate() + 1);
      return d;
    };

    if (startDate) {
      whereClause.createdAt = { gte: parseUtcDayStart(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lt: parseUtcNextDayStart(endDate),
      };
    }
    if (deliveryType && deliveryType !== 'ALL') {
      whereClause.deliveryType = deliveryType;
    }

    const toProductView = (order) => {
      // Si le produit relationnel existe, on l'utilise. Sinon on retombe sur produitNom (legacy).
      if (order?.product?.id) {
        return {
          productKey: `p:${order.product.id}`,
          product: order.product,
        };
      }

      const legacyName = (order?.produitNom || 'Produit (ancien)').trim();
      return {
        productKey: `legacy:${legacyName.toLowerCase()}`,
        product: {
          id: null,
          code: null,
          nom: legacyName,
          prixUnitaire: null,
        },
      };
    };

    // 1. TOP PRODUITS COMMANDÉS (toutes commandes créées)
    const allOrders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        productId: true,
        produitNom: true,
        quantite: true,
        montant: true,
        createdAt: true,
        deliveryType: true,
        status: true,
        callerId: true,
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
            prixUnitaire: true,
          },
        },
      },
    });

    const topCommandes = {};
    allOrders.forEach((order) => {
      const { productKey, product } = toProductView(order);
      if (!topCommandes[productKey]) {
        topCommandes[productKey] = {
          productKey,
          product,
          totalCommandes: 0,
          totalQuantite: 0,
          totalMontant: 0,
        };
      }
      topCommandes[productKey].totalCommandes++;
      topCommandes[productKey].totalQuantite += order.quantite || 0;
      topCommandes[productKey].totalMontant += order.montant || 0;
    });

    // 2. TOP PRODUITS VALIDÉS (par les appelants)
    const validatedOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: { in: ['VALIDEE', 'ASSIGNEE', 'LIVREE', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE', 'EXPEDITION'] },
      },
      select: {
        id: true,
        productId: true,
        produitNom: true,
        quantite: true,
        montant: true,
        createdAt: true,
        deliveryType: true,
        status: true,
        callerId: true,
        caller: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    const topValides = {};
    const topAppelantsValidation = {};
    validatedOrders.forEach((order) => {
      const { productKey, product } = toProductView(order);
      if (!topValides[productKey]) {
        topValides[productKey] = {
          productKey,
          product,
          totalValidees: 0,
          totalQuantite: 0,
        };
      }
      topValides[productKey].totalValidees++;
      topValides[productKey].totalQuantite += order.quantite || 0;

      // Par appelant
      if (order.callerId) {
        const callerKey = `${productKey}-caller:${order.callerId}`;
        if (!topAppelantsValidation[callerKey]) {
          topAppelantsValidation[callerKey] = {
            productKey,
            product,
            caller: order.caller,
            totalValidees: 0,
          };
        }
        topAppelantsValidation[callerKey].totalValidees++;
      }
    });

    // 3. TOP PRODUITS LIVRÉS
    const deliveredOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: { in: ['LIVREE', 'EXPRESS_LIVRE'] },
      },
      select: {
        id: true,
        productId: true,
        produitNom: true,
        quantite: true,
        montant: true,
        createdAt: true,
        deliveryType: true,
        status: true,
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
            prixUnitaire: true,
          },
        },
      },
    });

    const topLivres = {};
    deliveredOrders.forEach((order) => {
      const { productKey, product } = toProductView(order);
      if (!topLivres[productKey]) {
        topLivres[productKey] = {
          productKey,
          product,
          totalLivrees: 0,
          totalQuantite: 0,
          totalChiffreAffaires: 0,
        };
      }
      topLivres[productKey].totalLivrees++;
      topLivres[productKey].totalQuantite += order.quantite || 0;
      topLivres[productKey].totalChiffreAffaires += order.montant || 0;
    });

    // 4. TOP PRODUITS EXPÉDIÉS (EXPEDITION + EXPRESS)
    const shippedOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        deliveryType: { in: ['EXPEDITION', 'EXPRESS'] },
        status: { in: ['LIVREE', 'EXPRESS_LIVRE', 'EXPRESS_ARRIVE', 'EXPEDITION', 'ASSIGNEE'] },
      },
      select: {
        id: true,
        productId: true,
        produitNom: true,
        quantite: true,
        montant: true,
        createdAt: true,
        deliveryType: true,
        status: true,
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
      },
    });

    const topExpedies = {};
    shippedOrders.forEach((order) => {
      const { productKey, product } = toProductView(order);
      if (!topExpedies[productKey]) {
        topExpedies[productKey] = {
          productKey,
          product,
          totalExpeditions: 0,
          totalExpress: 0,
          totalQuantite: 0,
        };
      }
      if (order.deliveryType === 'EXPEDITION') {
        topExpedies[productKey].totalExpeditions++;
      } else {
        topExpedies[productKey].totalExpress++;
      }
      topExpedies[productKey].totalQuantite += order.quantite || 0;
    });

    // 5. TAUX DE CONVERSION (Commandé → Validé → Livré)
    const conversionRates = {};
    Object.keys(topCommandes).forEach((productKey) => {
      const commandes = topCommandes[productKey].totalCommandes;
      const valides = topValides[productKey]?.totalValidees || 0;
      const livres = topLivres[productKey]?.totalLivrees || 0;

      conversionRates[productKey] = {
        productKey,
        product: topCommandes[productKey].product,
        totalCommandes: commandes,
        totalValidees: valides,
        totalLivrees: livres,
        tauxValidation: commandes > 0 ? ((valides / commandes) * 100).toFixed(2) : 0,
        tauxLivraison: valides > 0 ? ((livres / valides) * 100).toFixed(2) : 0,
        tauxConversionGlobal: commandes > 0 ? ((livres / commandes) * 100).toFixed(2) : 0,
      };
    });

    // 6. STATISTIQUES GLOBALES
    const stats = {
      totalProduits: Object.keys(topCommandes).length,
      totalCommandes: allOrders.length,
      totalValidees: validatedOrders.length,
      totalLivrees: deliveredOrders.length,
      totalExpeditions: shippedOrders.filter((o) => o.deliveryType === 'EXPEDITION').length,
      totalExpress: shippedOrders.filter((o) => o.deliveryType === 'EXPRESS').length,
      chiffreAffairesTotal: Object.values(topLivres).reduce(
        (sum, item) => sum + item.totalChiffreAffaires,
        0
      ),
    };

    // Trier et formater les résultats
    const topCommandesArray = Object.values(topCommandes)
      .sort((a, b) => b.totalCommandes - a.totalCommandes)
      .slice(0, 20);

    const topValidesArray = Object.values(topValides)
      .sort((a, b) => b.totalValidees - a.totalValidees)
      .slice(0, 20);

    const topLivresArray = Object.values(topLivres)
      .sort((a, b) => b.totalLivrees - a.totalLivrees)
      .slice(0, 20);

    const topExpediesArray = Object.values(topExpedies)
      .sort((a, b) => b.totalQuantite - a.totalQuantite)
      .slice(0, 20);

    const conversionRatesArray = Object.values(conversionRates)
      .sort((a, b) => parseFloat(b.tauxConversionGlobal) - parseFloat(a.tauxConversionGlobal))
      .slice(0, 20);

    const topAppelantsArray = Object.values(topAppelantsValidation)
      .sort((a, b) => b.totalValidees - a.totalValidees)
      .slice(0, 20);

    res.json({
      stats,
      topCommandes: topCommandesArray,
      topValides: topValidesArray,
      topLivres: topLivresArray,
      topExpedies: topExpediesArray,
      conversionRates: conversionRatesArray,
      topAppelantsValidation: topAppelantsArray,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        deliveryType: deliveryType || 'ALL',
      },
    });
  } catch (error) {
    console.error('Erreur analytics produits:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques produits.',
      details: error.message,
    });
  }
});

// GET /api/analytics/products/:id - Détails d'un produit spécifique
router.get('/products/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const productId = parseInt(id);

    const whereClause = {
      productId,
      companyId: req.user.companyId,
    };

    const parseUtcDayStart = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);
    const parseUtcNextDayStart = (dateStr) => {
      const d = parseUtcDayStart(dateStr);
      d.setUTCDate(d.getUTCDate() + 1);
      return d;
    };

    if (startDate) {
      whereClause.createdAt = { gte: parseUtcDayStart(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lt: parseUtcNextDayStart(endDate),
      };
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: req.user.companyId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    // Toutes les commandes
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true },
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Statistiques par statut
    const statsByStatus = {};
    orders.forEach((order) => {
      if (!statsByStatus[order.status]) {
        statsByStatus[order.status] = {
          count: 0,
          quantite: 0,
          montant: 0,
        };
      }
      statsByStatus[order.status].count++;
      statsByStatus[order.status].quantite += order.quantite || 0;
      statsByStatus[order.status].montant += order.montant || 0;
    });

    // Statistiques par type de livraison
    const statsByDeliveryType = {};
    orders.forEach((order) => {
      if (!statsByDeliveryType[order.deliveryType]) {
        statsByDeliveryType[order.deliveryType] = {
          count: 0,
          quantite: 0,
        };
      }
      statsByDeliveryType[order.deliveryType].count++;
      statsByDeliveryType[order.deliveryType].quantite += order.quantite || 0;
    });

    // Évolution par mois
    const evolutionByMonth = {};
    orders.forEach((order) => {
      const month = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!evolutionByMonth[month]) {
        evolutionByMonth[month] = {
          month,
          commandes: 0,
          livrees: 0,
          quantite: 0,
          chiffreAffaires: 0,
        };
      }
      evolutionByMonth[month].commandes++;
      evolutionByMonth[month].quantite += order.quantite || 0;
      if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
        evolutionByMonth[month].livrees++;
        evolutionByMonth[month].chiffreAffaires += order.montant || 0;
      }
    });

    res.json({
      product,
      totalCommandes: orders.length,
      totalQuantite: orders.reduce((sum, o) => sum + (o.quantite || 0), 0),
      totalLivrees: orders.filter((o) => o.status === 'LIVREE' || o.status === 'EXPRESS_LIVRE')
        .length,
      chiffreAffaires: orders
        .filter((o) => o.status === 'LIVREE' || o.status === 'EXPRESS_LIVRE')
        .reduce((sum, o) => sum + (o.montant || 0), 0),
      statsByStatus,
      statsByDeliveryType,
      evolutionByMonth: Object.values(evolutionByMonth).sort((a, b) =>
        a.month.localeCompare(b.month)
      ),
      recentOrders: orders.slice(0, 10),
    });
  } catch (error) {
    console.error('Erreur détails produit:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des détails du produit.',
    });
  }
});

// GET /api/analytics/landing - Statistiques des pages de vente (landing pages)
router.get('/landing', authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;
    const companyId = req.user.companyId;

    const parseUtcDayStart = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);
    const parseUtcNextDayStart = (dateStr) => {
      const d = parseUtcDayStart(dateStr);
      d.setUTCDate(d.getUTCDate() + 1);
      return d;
    };

    const whereClause = { companyId };
    if (startDate) whereClause.createdAt = { gte: parseUtcDayStart(startDate) };
    if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lt: parseUtcNextDayStart(endDate) };

    const templates = await prisma.landingTemplate.findMany({
      where: { companyId },
      select: { id: true, nom: true, slug: true, productCode: true, productId: true, actif: true, config: true },
    });

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true, createdAt: true, status: true, montant: true, quantite: true,
        sourcePage: true, sourceCampagne: true, productId: true, produitNom: true,
        clientVille: true, deliveryType: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const templateProductIds = new Set(templates.map(t => t.productId).filter(Boolean));
    const templateProductCodes = new Set(templates.map(t => t.productCode?.toUpperCase()).filter(Boolean));
    const templateByProduct = {};
    templates.forEach(t => {
      if (t.productId) templateByProduct[`pid:${t.productId}`] = t;
      if (t.productCode) templateByProduct[`code:${t.productCode.toUpperCase()}`] = t;
    });

    const findTemplate = (order) => {
      if (order.sourcePage) {
        const sp = order.sourcePage.toLowerCase();
        const match = templates.find(t =>
          sp.includes(t.slug) || sp.includes(`/landing/${t.slug}`)
        );
        if (match) return match;
      }
      if (order.productId && templateByProduct[`pid:${order.productId}`])
        return templateByProduct[`pid:${order.productId}`];
      if (order.produitNom) {
        const code = order.produitNom.trim().toUpperCase();
        if (templateByProduct[`code:${code}`]) return templateByProduct[`code:${code}`];
      }
      return null;
    };

    const VALIDATED = ['VALIDEE', 'ASSIGNEE', 'LIVREE', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE', 'EXPEDITION'];
    const DELIVERED = ['LIVREE', 'EXPRESS_LIVRE'];
    const CANCELLED = ['ANNULEE', 'INJOIGNABLE', 'RETOUR'];

    const byTemplate = {};
    const timelineMap = {};
    const byCity = {};
    const byStatus = {};
    let totalLanding = 0;
    let totalOther = 0;

    orders.forEach(order => {
      const tpl = findTemplate(order);
      const key = tpl ? `tpl:${tpl.id}` : '_other';

      if (tpl) totalLanding++; else totalOther++;

      if (!byTemplate[key]) {
        byTemplate[key] = {
          templateId: tpl?.id || null,
          templateName: tpl?.nom || 'Autres sources',
          slug: tpl?.slug || null,
          actif: tpl?.actif ?? null,
          total: 0, validated: 0, delivered: 0, cancelled: 0,
          revenue: 0, quantite: 0,
        };
      }
      const entry = byTemplate[key];
      entry.total++;
      entry.quantite += order.quantite || 0;
      if (VALIDATED.includes(order.status)) entry.validated++;
      if (DELIVERED.includes(order.status)) {
        entry.delivered++;
        entry.revenue += order.montant || 0;
      }
      if (CANCELLED.includes(order.status)) entry.cancelled++;

      let dateKey;
      const d = new Date(order.createdAt);
      if (period === 'month') dateKey = d.toISOString().substring(0, 7);
      else if (period === 'week') {
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setUTCDate(diff);
        dateKey = monday.toISOString().substring(0, 10);
      } else dateKey = d.toISOString().substring(0, 10);

      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, total: 0, validated: 0, delivered: 0, cancelled: 0, revenue: 0 };
      timelineMap[dateKey].total++;
      if (VALIDATED.includes(order.status)) timelineMap[dateKey].validated++;
      if (DELIVERED.includes(order.status)) { timelineMap[dateKey].delivered++; timelineMap[dateKey].revenue += order.montant || 0; }
      if (CANCELLED.includes(order.status)) timelineMap[dateKey].cancelled++;

      const city = (order.clientVille || 'Non précisée').trim();
      if (!byCity[city]) byCity[city] = { city, total: 0, delivered: 0, revenue: 0 };
      byCity[city].total++;
      if (DELIVERED.includes(order.status)) { byCity[city].delivered++; byCity[city].revenue += order.montant || 0; }

      if (!byStatus[order.status]) byStatus[order.status] = 0;
      byStatus[order.status]++;
    });

    const templateStats = Object.values(byTemplate)
      .sort((a, b) => b.total - a.total);

    const timeline = Object.values(timelineMap)
      .sort((a, b) => a.date.localeCompare(b.date));

    const topCities = Object.values(byCity)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    const totalAll = orders.length;
    const totalValidated = orders.filter(o => VALIDATED.includes(o.status)).length;
    const totalDelivered = orders.filter(o => DELIVERED.includes(o.status)).length;
    const totalRevenue = orders.filter(o => DELIVERED.includes(o.status)).reduce((s, o) => s + (o.montant || 0), 0);
    const totalCancelled = orders.filter(o => CANCELLED.includes(o.status)).length;

    res.json({
      overview: {
        totalOrders: totalAll,
        totalFromLanding: totalLanding,
        totalOther,
        totalValidated,
        totalDelivered,
        totalCancelled,
        totalRevenue,
        conversionRate: totalAll > 0 ? ((totalDelivered / totalAll) * 100).toFixed(1) : '0',
        validationRate: totalAll > 0 ? ((totalValidated / totalAll) * 100).toFixed(1) : '0',
      },
      templateStats,
      timeline,
      topCities,
      statusBreakdown: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      filters: { startDate: startDate || null, endDate: endDate || null, period },
    });
  } catch (error) {
    console.error('Erreur analytics landing:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des analytics landing.', details: error.message });
  }
});

export default router;
