import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/express/en-agence - Récupérer tous les EXPRESS en agence avec stats
router.get('/en-agence', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { search, agence, statut, nonRetires, startDate, endDate } = req.query;

    // Construire le filtre
    const where = {
      deliveryType: 'EXPRESS',
      status: {
        in: ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE']
      }
    };

    // Filtre par recherche (nom, téléphone, référence, produit)
    if (search) {
      where.OR = [
        { clientNom: { contains: search, mode: 'insensitive' } },
        { clientTelephone: { contains: search } },
        { orderReference: { contains: search, mode: 'insensitive' } },
        { produitNom: { contains: search, mode: 'insensitive' } }
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

    // Filtre par dates :
    // - EXPRESS_LIVRE : filtrer par deliveredAt (jour du retrait = jour d'encaissement)
    // - EXPRESS_ARRIVE : filtrer par arriveAt (jour d'arrivée en agence)
    if (startDate || endDate) {
      const dateGte = startDate ? new Date(startDate + 'T00:00:00.000Z') : undefined;
      const dateLte = endDate ? new Date(endDate + 'T23:59:59.999Z') : undefined;

      const deliveredAtFilter = {};
      if (dateGte) deliveredAtFilter.gte = dateGte;
      if (dateLte) deliveredAtFilter.lte = dateLte;

      const arriveAtFilter = {};
      if (dateGte) arriveAtFilter.gte = dateGte;
      if (dateLte) arriveAtFilter.lte = dateLte;

      // Remplacer le filtre de statut par un OR combinant date + statut
      delete where.status;
      where.AND = [
        {
          OR: [
            { status: 'EXPRESS_LIVRE', deliveredAt: deliveredAtFilter },
            { status: 'EXPRESS_ARRIVE', arriveAt: arriveAtFilter }
          ]
        }
      ];

      // Respecter les filtres de statut/nonRetires déjà appliqués
      if (statut && statut !== 'all') {
        if (statut === 'EXPRESS_LIVRE') {
          delete where.AND;
          where.status = 'EXPRESS_LIVRE';
          where.deliveredAt = deliveredAtFilter;
        } else if (statut === 'EXPRESS_ARRIVE') {
          delete where.AND;
          where.status = 'EXPRESS_ARRIVE';
          where.arriveAt = arriveAtFilter;
        }
      }
      if (nonRetires === 'true') {
        delete where.AND;
        where.status = 'EXPRESS_ARRIVE';
        where.arriveAt = arriveAtFilter;
      }
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
    const retiresOrders = ordersWithStats.filter(o => o.status === 'EXPRESS_LIVRE');
    const nonRetiresOrders = ordersWithStats.filter(o => o.status === 'EXPRESS_ARRIVE');
    const stats = {
      total: ordersWithStats.length,
      nonRetires: nonRetiresOrders.length,
      retires: retiresOrders.length,
      montantEncaisse: retiresOrders.reduce((sum, o) => sum + (o.montant * 0.90), 0),
      montantEnAttente: nonRetiresOrders.reduce((sum, o) => sum + (o.montant * 0.90), 0),
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
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas en attente de retrait.' });
    }

    // Transaction pour gérer le stock et la commande
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le statut à EXPRESS_LIVRE
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS_LIVRE',
          deliveredAt: new Date(), // Date de retrait
        }
      });

      // 2. Diminuer le stock EXPRESS (réservé) si un produit est associé
      if (order.productId && order.product) {
        const stockAvant = order.product.stockExpress || 0;
        const stockApres = Math.max(0, stockAvant - order.quantite);

        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockExpress: stockApres
          }
        });

        // 3. Créer le mouvement de stock
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            quantite: order.quantite,
            type: 'RETRAIT_EXPRESS',
            stockAvant: stockAvant,
            stockApres: stockApres,
            effectuePar: req.user.id,
            motif: `Retrait EXPRESS par client - Commande ${order.orderReference}`,
            orderId: order.id
          }
        });
      }

      // 4. Créer l'historique de statut
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: 'EXPRESS_ARRIVE',
          newStatus: 'EXPRESS_LIVRE',
          changedBy: req.user.id,
          comment: `Colis retiré par le client - Confirmé par ${req.user.prenom} ${req.user.nom}`
        }
      });

      return updatedOrder;
    });

    res.json({
      order: result,
      message: 'Retrait confirmé avec succès. Stock EXPRESS mis à jour.'
    });
  } catch (error) {
    console.error('Erreur confirmation retrait:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du retrait.' });
  }
});

export default router;

