import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/express/en-agence - Récupérer tous les EXPRESS en agence avec stats
router.get('/en-agence', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { search, agence, statut, nonRetires } = req.query;

    // Construire le filtre
    const where = {
      deliveryType: 'EXPRESS',
      status: {
        in: ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE']
      }
    };

    // Filtre par recherche (nom, téléphone, référence)
    if (search) {
      where.OR = [
        { clientNom: { contains: search, mode: 'insensitive' } },
        { clientTelephone: { contains: search } },
        { orderReference: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par agence
    if (agence && agence !== 'all') {
      where.agenceRetrait = agence;
    }

    // Filtre par statut
    if (statut && statut !== 'all') {
      where.status = statut;
    }

    // Filtre non retirés uniquement
    if (nonRetires === 'true') {
      where.status = 'EXPRESS_ARRIVE';
    }

    // Récupérer les commandes avec notifications
    const orders = await prisma.order.findMany({
      where,
      include: {
        product: { select: { nom: true } },
        caller: { select: { id: true, nom: true, prenom: true } },
        expressNotifications: {
          include: {
            user: { select: { id: true, nom: true, prenom: true } }
          },
          orderBy: {
            notifiedAt: 'desc'
          }
        }
      },
      orderBy: {
        arriveAt: 'desc'
      }
    });

    // Calculer les stats pour chaque commande
    const ordersWithStats = orders.map(order => ({
      ...order,
      nombreNotifications: order.expressNotifications.length,
      derniereNotification: order.expressNotifications[0] || null,
      joursEnAgence: order.arriveAt 
        ? Math.floor((new Date() - new Date(order.arriveAt)) / (1000 * 60 * 60 * 24))
        : 0
    }));

    // Stats globales
    const stats = {
      total: ordersWithStats.length,
      nonRetires: ordersWithStats.filter(o => o.status === 'EXPRESS_ARRIVE').length,
      retires: ordersWithStats.filter(o => o.status === 'EXPRESS_LIVRE').length,
      montantEnAttente: ordersWithStats
        .filter(o => o.status === 'EXPRESS_ARRIVE')
        .reduce((sum, o) => sum + (o.montant * 0.90), 0),
      nombreNotificationsTotal: ordersWithStats.reduce((sum, o) => sum + o.nombreNotifications, 0),
      agences: [...new Set(ordersWithStats.map(o => o.agenceRetrait))].filter(Boolean)
    };

    res.json({
      orders: ordersWithStats,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération EXPRESS en agence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des EXPRESS.' });
  }
});

// POST /api/express/:id/notifier - Notifier le client
router.post('/:id/notifier', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas en attente de retrait.' });
    }

    // Créer la notification
    const notification = await prisma.expressNotification.create({
      data: {
        orderId: parseInt(id),
        userId: req.user.id,
        note: note || null
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Mettre à jour la note appelant avec un historique
    const noteExistante = order.noteAppelant || '';
    const nouvelleNote = `${noteExistante}\n[${new Date().toLocaleString('fr-FR')}] Notifié par ${req.user.prenom} ${req.user.nom}${note ? ': ' + note : ''}`.trim();
    
    await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        noteAppelant: nouvelleNote
      }
    });

    res.json({
      notification,
      message: 'Client notifié avec succès.'
    });
  } catch (error) {
    console.error('Erreur notification client:', error);
    res.status(500).json({ error: 'Erreur lors de la notification du client.' });
  }
});

// POST /api/express/:id/confirmer-retrait - Confirmer le retrait par le client
router.post('/:id/confirmer-retrait', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas en attente de retrait.' });
    }

    // Mettre à jour le statut à EXPRESS_LIVRE
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS_LIVRE',
        deliveredAt: new Date(), // Date de retrait
      }
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_LIVRE',
        changedBy: req.user.id,
        comment: `Colis retiré par le client - Confirmé par ${req.user.prenom} ${req.user.nom}`
      }
    });

    res.json({
      order: updatedOrder,
      message: 'Retrait confirmé avec succès.'
    });
  } catch (error) {
    console.error('Erreur confirmation retrait:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du retrait.' });
  }
});

export default router;

