import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

router.use(authenticate);

// GET /api/stats/overview - Vue d'ensemble (Admin/Gestionnaire)
router.get('/overview', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const companyFilter = { companyId: req.user.companyId };
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      // Les dates arrivent souvent au format YYYY-MM-DD (sans heure).
      // On inclut toute la journée (UTC) pour éviter d'exclure la date de fin.
      if (startDate) dateFilter.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) dateFilter.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const baseWhere = { ...companyFilter, ...dateFilter };

    // Statistiques globales
    const [
      totalOrders,
      newOrders,
      validatedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({ where: { ...baseWhere, status: { in: ['NOUVELLE', 'A_APPELER'] } } }),
      prisma.order.count({ where: { ...baseWhere, status: 'VALIDEE' } }),
      prisma.order.count({ where: { ...baseWhere, status: 'LIVREE' } }),
      prisma.order.count({ where: { ...baseWhere, status: { in: ['ANNULEE', 'REFUSEE', 'ANNULEE_LIVRAISON'] } } }),
      prisma.order.aggregate({
        where: { ...baseWhere, status: 'LIVREE' },
        _sum: { montant: true }
      })
    ]);

    // Commandes par statut
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true
    });

    // Top produits
    const topProducts = await prisma.order.groupBy({
      by: ['produitNom'],
      where: { ...baseWhere, status: 'LIVREE' },
      _count: true,
      _sum: { montant: true },
      orderBy: { _count: { produitNom: 'desc' } },
      take: 10
    });

    // Top villes
    const topCities = await prisma.order.groupBy({
      by: ['clientVille'],
      where: { ...baseWhere, status: 'LIVREE' },
      _count: true,
      _sum: { montant: true },
      orderBy: { _count: { clientVille: 'desc' } },
      take: 10
    });

    res.json({
      overview: {
        totalOrders,
        newOrders,
        validatedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue._sum.montant || 0,
        conversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0
      },
      ordersByStatus,
      topProducts,
      topCities
    });
  } catch (error) {
    console.error('Erreur récupération statistiques overview:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

// GET /api/stats/callers - Statistiques des appelants (Admin/Gestionnaire)
router.get('/callers', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, callerId } = req.query;

    const where = { user: { companyId: req.user.companyId } };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    if (callerId) where.userId = parseInt(callerId);

    const stats = await prisma.callStatistic.findMany({
      where,
      include: {
        user: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Agréger par appelant
    const callerStats = {};
    stats.forEach(stat => {
      const userId = stat.userId;
      if (!callerStats[userId]) {
        callerStats[userId] = {
          user: stat.user,
          totalAppels: 0,
          totalValides: 0,
          totalAnnules: 0,
          totalInjoignables: 0
        };
      }
      callerStats[userId].totalAppels += stat.totalAppels;
      callerStats[userId].totalValides += stat.totalValides;
      callerStats[userId].totalAnnules += stat.totalAnnules;
      callerStats[userId].totalInjoignables += stat.totalInjoignables;
    });

    // Récupérer TOUS les appelants actifs pour s'assurer qu'on ne manque personne
    const allCallers = await prisma.user.findMany({
      where: {
        companyId: req.user.companyId,
        role: 'APPELANT',
        actif: true
      },
      select: {
        id: true,
        nom: true,
        prenom: true
      }
    });

    // Ajouter les appelants qui n'ont pas encore de stats dans CallStatistic
    allCallers.forEach(caller => {
      if (!callerStats[caller.id]) {
        callerStats[caller.id] = {
          user: caller,
          totalAppels: 0,
          totalValides: 0,
          totalAnnules: 0,
          totalInjoignables: 0
        };
      }
    });

    // Récupérer les statistiques EXPRESS et EXPEDITION depuis les commandes
    // ⚠️ Bug fixé : on ne doit pas écraser le filtre de date en ajoutant "expedieAt: { not: null }"
    const expedieAtWhere = { not: null };
    if (startDate) expedieAtWhere.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) expedieAtWhere.lte = new Date(`${endDate}T23:59:59.999Z`);

    const orders = await prisma.order.findMany({
      where: {
        companyId: req.user.companyId,
        callerId: callerId ? parseInt(callerId) : { not: null },
        deliveryType: { in: ['EXPEDITION', 'EXPRESS'] },
        expedieAt: expedieAtWhere // Date d'expédition (EXPEDITION/EXPRESS)
      },
      select: {
        callerId: true,
        deliveryType: true,
        status: true
      }
    });

    // Ajouter les stats EXPRESS et EXPEDITION
    orders.forEach(order => {
      const userId = order.callerId;
      if (callerStats[userId]) {
        if (order.deliveryType === 'EXPEDITION') {
          callerStats[userId].totalExpeditions = (callerStats[userId].totalExpeditions || 0) + 1;
        } else if (order.deliveryType === 'EXPRESS') {
          callerStats[userId].totalExpress = (callerStats[userId].totalExpress || 0) + 1;
        }
      }
    });

    const result = Object.values(callerStats).map(caller => ({
      ...caller,
      totalExpeditions: caller.totalExpeditions || 0,
      totalExpress: caller.totalExpress || 0,
      tauxValidation: caller.totalAppels > 0 
        ? ((caller.totalValides / caller.totalAppels) * 100).toFixed(2)
        : 0
    }));

    res.json({ stats: result });
  } catch (error) {
    console.error('Erreur récupération statistiques appelants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques des appelants.' });
  }
});

// GET /api/stats/prepaid-expeditions - Détail des commandes EXPEDITION payées en avance (Admin/Gestionnaire)
router.get('/prepaid-expeditions', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, search, callerId, onlyExpedied } = req.query;

    const where = {
      companyId: req.user.companyId,
      deliveryType: 'EXPEDITION',
      callerId: { not: null },
      validatedAt: { not: null },
      enAttentePaiement: false,
      montantPaye: { not: null }
    };

    if (callerId) {
      where.callerId = parseInt(callerId);
    }

    if (startDate || endDate) {
      where.validatedAt = {};
      if (startDate) where.validatedAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.validatedAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (onlyExpedied === 'true') {
      where.expedieAt = { not: null };
    }

    if (search) {
      where.OR = [
        { clientNom: { contains: search, mode: 'insensitive' } },
        { clientTelephone: { contains: search } },
        { clientVille: { contains: search, mode: 'insensitive' } },
        { clientCommune: { contains: search, mode: 'insensitive' } },
        { clientAdresse: { contains: search, mode: 'insensitive' } },
        { produitNom: { contains: search, mode: 'insensitive' } },
        { orderReference: { contains: search, mode: 'insensitive' } },
        { referencePayment: { contains: search, mode: 'insensitive' } },
        { codeExpedition: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        },
        orderBy: [
          { validatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 500
      })
    ]);

    res.json({ total, orders });
  } catch (error) {
    console.error('Erreur récupération prepaid expeditions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des expéditions payées.' });
  }
});

// GET /api/stats/deliverers - Statistiques des livreurs (Admin/Gestionnaire)
router.get('/deliverers', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, delivererId } = req.query;

    const where = { user: { companyId: req.user.companyId } };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
    if (delivererId) where.userId = parseInt(delivererId);

    const stats = await prisma.deliveryStatistic.findMany({
      where,
      include: {
        user: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Agréger par livreur
    const delivererStats = {};
    stats.forEach(stat => {
      const userId = stat.userId;
      if (!delivererStats[userId]) {
        delivererStats[userId] = {
          user: stat.user,
          totalLivraisons: 0,
          totalRefusees: 0,
          totalAnnulees: 0,
          montantLivre: 0
        };
      }
      delivererStats[userId].totalLivraisons += stat.totalLivraisons;
      delivererStats[userId].totalRefusees += stat.totalRefusees;
      delivererStats[userId].totalAnnulees += stat.totalAnnulees;
      delivererStats[userId].montantLivre += stat.montantLivre;
    });

    const result = Object.values(delivererStats).map(deliverer => {
      const total = deliverer.totalLivraisons + deliverer.totalRefusees + deliverer.totalAnnulees;
      return {
        ...deliverer,
        tauxReussite: total > 0 
          ? ((deliverer.totalLivraisons / total) * 100).toFixed(2)
          : 0
      };
    });

    res.json({ stats: result });
  } catch (error) {
    console.error('Erreur récupération statistiques livreurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques des livreurs.' });
  }
});

// GET /api/stats/call-activity - Activité des appels heure par heure (Admin/Gestionnaire)
// Source de vérité : StatusHistory (changedBy + createdAt + newStatus).
// ⚠️ StatusHistory n'a PAS de relation user dans le schéma (changedBy est un Int brut) :
// on récupère donc les employés de la compagnie séparément puis on fait le join en JS.
router.get('/call-activity', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { date } = req.query;

    // Journée bornée en UTC (Abidjan = UTC, pas de décalage horaire).
    // Param `date` au format YYYY-MM-DD, défaut = aujourd'hui.
    const day = /^\d{4}-\d{2}-\d{2}$/.test(date || '')
      ? date
      : new Date().toISOString().slice(0, 10);
    const gte = new Date(`${day}T00:00:00.000Z`);
    const lte = new Date(`${day}T23:59:59.999Z`);

    // Tous les utilisateurs de la compagnie (pour le join + le rôle).
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: { id: true, nom: true, prenom: true, role: true }
    });
    const usersById = new Map(users.map(u => [u.id, u]));

    // Historique du jour, restreint aux commandes de la compagnie et aux
    // changements faits par ses employés (exclut changedBy=0 des liens publics).
    const history = await prisma.statusHistory.findMany({
      where: {
        createdAt: { gte, lte },
        changedBy: { in: users.map(u => u.id) },
        order: { companyId: req.user.companyId }
      },
      include: {
        order: { select: { id: true, clientNom: true, clientTelephone: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 5000 // garde-fou, une journée d'appels reste très en dessous
    });

    // Action dérivée : certaines entrées ne changent pas le statut
    // (oldStatus === newStatus) — le commentaire porte alors l'action réelle
    // (ex. "Marquée En attente de paiement", "RDV programmé…").
    const deriveAction = (h) => {
      const c = (h.comment || '').toLowerCase();
      if (c.includes('attente de paiement')) return 'ATTENTE_PAIEMENT';
      if (c.startsWith('rdv')) return 'RDV';
      return h.newStatus;
    };

    // Regrouper par employé
    const byUser = new Map();
    for (const h of history) {
      const user = usersById.get(h.changedBy);
      if (!user) continue; // ne devrait pas arriver (filtre in:), sécurité
      let entry = byUser.get(h.changedBy);
      if (!entry) {
        entry = {
          user,
          firstActionAt: h.createdAt,
          lastActionAt: h.createdAt,
          totalActions: 0,
          byStatus: {},
          timeline: []
        };
        byUser.set(h.changedBy, entry);
      }
      const action = deriveAction(h);
      entry.lastActionAt = h.createdAt; // history trié asc → dernière vue = dernière action
      entry.totalActions += 1;
      entry.byStatus[action] = (entry.byStatus[action] || 0) + 1;
      entry.timeline.push({
        at: h.createdAt,
        orderId: h.orderId,
        clientNom: h.order?.clientNom || '',
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        action,
        comment: h.comment
      });
    }

    const employees = [...byUser.values()]
      .sort((a, b) => new Date(a.firstActionAt) - new Date(b.firstActionAt));

    res.json({ date: day, employees });
  } catch (error) {
    console.error('Erreur récupération activité des appels:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'activité des appels.' });
  }
});

// GET /api/stats/my-stats - Statistiques personnelles (Appelant/Livreur)
router.get('/my-stats', authorize('APPELANT', 'LIVREUR'), async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const user = req.user;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (user.role === 'APPELANT') {
      const stats = await prisma.callStatistic.findMany({
        where: {
          userId: user.id,
          user: { companyId: req.user.companyId },
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' }
      });

      const totals = stats.reduce((acc, stat) => ({
        totalAppels: acc.totalAppels + stat.totalAppels,
        totalValides: acc.totalValides + stat.totalValides,
        totalAnnules: acc.totalAnnules + stat.totalAnnules,
        totalInjoignables: acc.totalInjoignables + stat.totalInjoignables
      }), { totalAppels: 0, totalValides: 0, totalAnnules: 0, totalInjoignables: 0 });

      // Récupérer les statistiques EXPRESS et EXPEDITION
      const orders = await prisma.order.findMany({
        where: {
          companyId: req.user.companyId,
          callerId: user.id,
          expedieAt: { gte: startDate }, // Utiliser expedieAt pour la date de création EXPEDITION/EXPRESS
          deliveryType: { in: ['EXPEDITION', 'EXPRESS'] }
        },
        select: {
          deliveryType: true
        }
      });

      totals.totalExpeditions = orders.filter(o => o.deliveryType === 'EXPEDITION').length;
      totals.totalExpress = orders.filter(o => o.deliveryType === 'EXPRESS').length;
      totals.tauxValidation = totals.totalAppels > 0 
        ? ((totals.totalValides / totals.totalAppels) * 100).toFixed(2)
        : 0;

      res.json({ stats: totals, details: stats });
    } else if (user.role === 'LIVREUR') {
      const stats = await prisma.deliveryStatistic.findMany({
        where: {
          userId: user.id,
          user: { companyId: req.user.companyId },
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' }
      });

      const totals = stats.reduce((acc, stat) => ({
        totalLivraisons: acc.totalLivraisons + stat.totalLivraisons,
        totalRefusees: acc.totalRefusees + stat.totalRefusees,
        totalAnnulees: acc.totalAnnulees + stat.totalAnnulees,
        montantLivre: acc.montantLivre + stat.montantLivre
      }), { totalLivraisons: 0, totalRefusees: 0, totalAnnulees: 0, montantLivre: 0 });

      const total = totals.totalLivraisons + totals.totalRefusees + totals.totalAnnulees;
      totals.tauxReussite = total > 0 
        ? ((totals.totalLivraisons / total) * 100).toFixed(2)
        : 0;

      res.json({ stats: totals, details: stats });
    }
  } catch (error) {
    console.error('Erreur récupération statistiques personnelles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos statistiques.' });
  }
});

// GET /api/stats/export - Export des données (Admin)
router.get('/export', authorize('ADMIN'), async (req, res) => {
  try {
    const { type = 'orders', startDate, endDate } = req.query;

    const companyFilter = { companyId: req.user.companyId };
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) dateFilter.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    let data;
    if (type === 'orders') {
      data = await prisma.order.findMany({
        where: { ...companyFilter, ...dateFilter },
        include: {
          caller: { select: { nom: true, prenom: true } },
          deliverer: { select: { nom: true, prenom: true } }
        }
      });
    } else if (type === 'callers') {
      data = await prisma.callStatistic.findMany({
        where: {
          user: { companyId: req.user.companyId },
          ...(dateFilter.createdAt ? { date: dateFilter.createdAt } : {})
        },
        include: {
          user: { select: { nom: true, prenom: true, email: true } }
        }
      });
    } else if (type === 'deliverers') {
      data = await prisma.deliveryStatistic.findMany({
        where: {
          user: { companyId: req.user.companyId },
          ...(dateFilter.createdAt ? { date: dateFilter.createdAt } : {})
        },
        include: {
          user: { select: { nom: true, prenom: true, email: true } }
        }
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données.' });
  }
});

export default router;










