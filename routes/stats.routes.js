import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stats/overview - Vue d'ensemble (Admin/Gestionnaire)
router.get('/overview', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Statistiques globales
    const [
      totalOrders,
      newOrders,
      validatedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count({ where: dateFilter }),
      prisma.order.count({ where: { ...dateFilter, status: { in: ['NOUVELLE', 'A_APPELER'] } } }),
      prisma.order.count({ where: { ...dateFilter, status: 'VALIDEE' } }),
      prisma.order.count({ where: { ...dateFilter, status: 'LIVREE' } }),
      prisma.order.count({ where: { ...dateFilter, status: { in: ['ANNULEE', 'REFUSEE', 'ANNULEE_LIVRAISON'] } } }),
      prisma.order.aggregate({
        where: { ...dateFilter, status: 'LIVREE' },
        _sum: { montant: true }
      })
    ]);

    // Commandes par statut
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true
    });

    // Top produits
    const topProducts = await prisma.order.groupBy({
      by: ['produitNom'],
      where: { ...dateFilter, status: 'LIVREE' },
      _count: true,
      _sum: { montant: true },
      orderBy: { _count: { produitNom: 'desc' } },
      take: 10
    });

    // Top villes
    const topCities = await prisma.order.groupBy({
      by: ['clientVille'],
      where: { ...dateFilter, status: 'LIVREE' },
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

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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

    const result = Object.values(callerStats).map(caller => ({
      ...caller,
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

// GET /api/stats/deliverers - Statistiques des livreurs (Admin/Gestionnaire)
router.get('/deliverers', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, delivererId } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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

      totals.tauxValidation = totals.totalAppels > 0 
        ? ((totals.totalValides / totals.totalAppels) * 100).toFixed(2)
        : 0;

      res.json({ stats: totals, details: stats });
    } else if (user.role === 'LIVREUR') {
      const stats = await prisma.deliveryStatistic.findMany({
        where: {
          userId: user.id,
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

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    let data;
    if (type === 'orders') {
      data = await prisma.order.findMany({
        where: dateFilter,
        include: {
          caller: { select: { nom: true, prenom: true } },
          deliverer: { select: { nom: true, prenom: true } }
        }
      });
    } else if (type === 'callers') {
      data = await prisma.callStatistic.findMany({
        where: dateFilter.createdAt ? { date: dateFilter.createdAt } : {},
        include: {
          user: { select: { nom: true, prenom: true, email: true } }
        }
      });
    } else if (type === 'deliverers') {
      data = await prisma.deliveryStatistic.findMany({
        where: dateFilter.createdAt ? { date: dateFilter.createdAt } : {},
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




