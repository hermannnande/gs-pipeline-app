import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

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

    const where = {};
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
        id: { in: orderIds.map(id => parseInt(id)) }
      }
    });

    const invalidOrders = ordersToAssign.filter(o => o.deliveryType === 'EXPEDITION' || o.deliveryType === 'EXPRESS');
    if (invalidOrders.length > 0) {
      return res.status(400).json({ 
        error: `${invalidOrders.length} commande(s) EXPEDITION/EXPRESS détectée(s). Utilisez la route d'assignation spécifique pour ces commandes.` 
      });
    }

    // Créer la liste de livraison
    const deliveryList = await prisma.deliveryList.create({
      data: {
        nom: listName || `Livraison ${new Date(deliveryDate).toLocaleDateString('fr-FR')}`,
        date: new Date(deliveryDate),
        delivererId: parseInt(delivererId),
        zone: zone || null
      }
    });

    // Assigner les commandes
    const updatePromises = orderIds.map(orderId =>
      prisma.order.update({
        where: { id: parseInt(orderId) },
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

// GET /api/delivery/validated-orders - Commandes validées en attente d'assignation (Gestionnaire/Admin)
router.get('/validated-orders', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { ville, startDate, endDate } = req.query;

    const where = {
      status: 'VALIDEE',
      delivererId: null
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

