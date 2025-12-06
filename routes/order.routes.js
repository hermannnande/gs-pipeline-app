import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Toutes les routes nécessitent authentification
router.use(authenticate);

// GET /api/orders - Liste des commandes (avec filtres selon rôle)
router.get('/', async (req, res) => {
  try {
    const { status, ville, produit, startDate, endDate, callerId, delivererId, page = 1, limit = 50 } = req.query;
    const user = req.user;

    const where = {};

    // Filtres selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant voit uniquement ses commandes assignées ou les commandes à appeler non assignées
      where.OR = [
        { callerId: user.id },
        { status: { in: ['NOUVELLE', 'A_APPELER'] }, callerId: null }
      ];
    } else if (user.role === 'LIVREUR') {
      // Le livreur voit uniquement ses commandes assignées
      where.delivererId = user.id;
    } else if (user.role === 'GESTIONNAIRE') {
      // Le gestionnaire voit toutes les commandes validées et celles en cours de livraison
      // (pas de restriction)
    } else if (user.role === 'ADMIN') {
      // L'admin voit tout (pas de restriction)
    }

    // Filtres supplémentaires
    if (status) where.status = status;
    if (ville) where.clientVille = { contains: ville, mode: 'insensitive' };
    if (produit) where.produitNom = { contains: produit, mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId);
    if (delivererId) where.delivererId = parseInt(delivererId);
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

// GET /api/orders/:id - Détails d'une commande
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier les permissions selon le rôle
    if (user.role === 'APPELANT' && order.callerId !== user.id && order.callerId !== null) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }
    if (user.role === 'LIVREUR' && order.delivererId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande.' });
  }
});

// POST /api/orders - Créer une commande manuellement (Admin/Gestionnaire)
router.post('/', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientNom').notEmpty().withMessage('Nom du client requis'),
  body('clientTelephone').notEmpty().withMessage('Téléphone requis'),
  body('clientVille').notEmpty().withMessage('Ville requise'),
  body('produitNom').notEmpty().withMessage('Nom du produit requis'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('montant').isFloat({ min: 0 }).withMessage('Montant invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderData = {
      clientNom: req.body.clientNom,
      clientTelephone: req.body.clientTelephone,
      clientVille: req.body.clientVille,
      clientCommune: req.body.clientCommune,
      clientAdresse: req.body.clientAdresse,
      produitNom: req.body.produitNom,
      produitPage: req.body.produitPage,
      quantite: req.body.quantite,
      montant: req.body.montant,
      sourceCampagne: req.body.sourceCampagne,
      sourcePage: req.body.sourcePage,
      status: 'NOUVELLE'
    };

    const order = await prisma.order.create({
      data: orderData
    });

    // Créer l'historique initial
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'NOUVELLE',
        changedBy: req.user.id,
        comment: 'Commande créée manuellement'
      }
    });

    res.status(201).json({ order, message: 'Commande créée avec succès.' });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande.' });
  }
});

// PUT /api/orders/:id/status - Changer le statut d'une commande
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifications selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant peut changer : A_APPELER -> VALIDEE/ANNULEE/INJOIGNABLE
      if (!['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un appelant.' });
      }
      // Assigner l'appelant si ce n'est pas déjà fait
      if (!order.callerId) {
        await prisma.order.update({
          where: { id: parseInt(id) },
          data: { callerId: user.id, calledAt: new Date() }
        });
      }
    } else if (user.role === 'LIVREUR') {
      // Le livreur peut changer : ASSIGNEE -> LIVREE/REFUSEE/ANNULEE_LIVRAISON
      if (!['LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un livreur.' });
      }
      if (order.delivererId !== user.id) {
        return res.status(403).json({ error: 'Cette commande ne vous est pas assignée.' });
      }
    }

    // Transaction pour gérer le statut + stock de manière cohérente
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la commande
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status,
          noteAppelant: user.role === 'APPELANT' && note ? note : order.noteAppelant,
          noteLivreur: user.role === 'LIVREUR' && note ? note : order.noteLivreur,
          noteGestionnaire: (user.role === 'GESTIONNAIRE' || user.role === 'ADMIN') && note ? note : order.noteGestionnaire,
          validatedAt: status === 'VALIDEE' ? new Date() : order.validatedAt,
          deliveredAt: status === 'LIVREE' ? new Date() : order.deliveredAt
        },
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          },
          product: true
        }
      });

      // RÈGLE MÉTIER : Décrémenter le stock uniquement si la commande est LIVRÉE
      if (status === 'LIVREE' && order.productId) {
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          const stockAvant = product.stockActuel;
          const stockApres = stockAvant - order.quantite;

          // Mettre à jour le stock du produit
          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          // Créer le mouvement de stock
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'LIVRAISON',
              quantite: -order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
              motif: `Livraison commande ${order.orderReference} - ${order.clientNom}`
            }
          });
        }
      }

      return updated;
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: status,
        changedBy: user.id,
        comment: note
      }
    });

    // Mettre à jour les statistiques
    await updateStatistics(user.id, user.role, order.status, status, order.montant);

    res.json({ order: updatedOrder, message: 'Statut mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// Fonction helper pour mettre à jour les statistiques
async function updateStatistics(userId, role, oldStatus, newStatus, montant) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (role === 'APPELANT') {
    // Statistiques des appelants
    const stat = await prisma.callStatistic.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    const updateData = {
      totalAppels: { increment: 1 }
    };

    if (newStatus === 'VALIDEE') updateData.totalValides = { increment: 1 };
    if (newStatus === 'ANNULEE') updateData.totalAnnules = { increment: 1 };
    if (newStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: 1 };

    if (stat) {
      await prisma.callStatistic.update({
        where: { id: stat.id },
        data: updateData
      });
    } else {
      await prisma.callStatistic.create({
        data: {
          userId,
          date: today,
          totalAppels: 1,
          totalValides: newStatus === 'VALIDEE' ? 1 : 0,
          totalAnnules: newStatus === 'ANNULEE' ? 1 : 0,
          totalInjoignables: newStatus === 'INJOIGNABLE' ? 1 : 0
        }
      });
    }
  } else if (role === 'LIVREUR') {
    // Statistiques des livreurs
    const stat = await prisma.deliveryStatistic.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    const updateData = {};
    if (newStatus === 'LIVREE') {
      updateData.totalLivraisons = { increment: 1 };
      updateData.montantLivre = { increment: montant };
    }
    if (newStatus === 'REFUSEE') updateData.totalRefusees = { increment: 1 };
    if (newStatus === 'ANNULEE_LIVRAISON') updateData.totalAnnulees = { increment: 1 };

    if (stat) {
      await prisma.deliveryStatistic.update({
        where: { id: stat.id },
        data: updateData
      });
    } else {
      await prisma.deliveryStatistic.create({
        data: {
          userId,
          date: today,
          totalLivraisons: newStatus === 'LIVREE' ? 1 : 0,
          totalRefusees: newStatus === 'REFUSEE' ? 1 : 0,
          totalAnnulees: newStatus === 'ANNULEE_LIVRAISON' ? 1 : 0,
          montantLivre: newStatus === 'LIVREE' ? montant : 0
        }
      });
    }
  }
}

// PUT /api/orders/:id - Modifier une commande (Admin/Gestionnaire)
router.put('/:id', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Ne pas permettre la modification du statut par cette route
    delete updateData.status;

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true }
        }
      }
    });

    res.json({ order, message: 'Commande modifiée avec succès.' });
  } catch (error) {
    console.error('Erreur modification commande:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la commande.' });
  }
});

// DELETE /api/orders/:id - Supprimer une commande (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la commande avec ses informations de produit
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Transaction pour gérer la suppression et la restauration du stock
    await prisma.$transaction(async (tx) => {
      // Si la commande était LIVREE et liée à un produit, restaurer le stock
      if (order.status === 'LIVREE' && order.productId && order.product) {
        const stockAvant = order.product.stockActuel;
        const stockApres = stockAvant + order.quantite;

        // Restaurer le stock
        await tx.product.update({
          where: { id: order.productId },
          data: { stockActuel: stockApres }
        });

        // Créer un mouvement de stock pour la restauration
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'CORRECTION',
            quantite: order.quantite,
            stockAvant,
            stockApres,
            effectuePar: req.user.id,
            motif: `Restauration stock suite à suppression de la commande ${order.orderReference}`
          }
        });
      }

      // Supprimer les mouvements de stock liés à cette commande
      await tx.stockMovement.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer l'historique des statuts
      await tx.statusHistory.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer la commande
      await tx.order.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({ message: 'Commande supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande.' });
  }
});

export default router;

