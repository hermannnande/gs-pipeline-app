import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/fix-stock/analyze - Analyser les corrections manquantes
router.get('/analyze', authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🔍 Analyse des corrections de livraison...');

    // Trouver toutes les commandes qui ont changé de LIVREE vers autre chose
    const statusHistories = await prisma.statusHistory.findMany({
      where: {
        oldStatus: 'LIVREE',
        newStatus: {
          in: ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE', 'ASSIGNEE']
        }
      },
      include: {
        order: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Trouvé ${statusHistories.length} correction(s) de statut LIVREE → autre`);

    // Pour chaque correction, vérifier si un mouvement de RETOUR existe
    const correctionsToFix = [];

    for (const history of statusHistories) {
      if (!history.order || !history.order.productId) {
        continue;
      }

      // Chercher un mouvement de RETOUR pour cette commande après la correction
      const returnMovement = await prisma.stockMovement.findFirst({
        where: {
          orderId: history.orderId,
          type: 'RETOUR',
          createdAt: {
            gte: history.createdAt
          }
        }
      });

      if (!returnMovement) {
        // Pas de mouvement de retour = Stock pas corrigé !
        correctionsToFix.push({
          historyId: history.id,
          orderId: history.orderId,
          orderReference: history.order.orderReference,
          clientNom: history.order.clientNom,
          productId: history.order.productId,
          productNom: history.order.product?.nom || history.order.produitNom,
          quantite: history.order.quantite,
          stockActuel: history.order.product?.stockActuel,
          stockApresCorrection: history.order.product?.stockActuel + history.order.quantite,
          oldStatus: history.oldStatus,
          newStatus: history.newStatus,
          correctionDate: history.createdAt,
          changedBy: history.changedBy
        });
      }
    }

    console.log(`📊 ${correctionsToFix.length} stock(s) à réajuster`);

    res.json({
      total: statusHistories.length,
      toFix: correctionsToFix.length,
      corrections: correctionsToFix
    });
  } catch (error) {
    console.error('Erreur analyse:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse' });
  }
});

// POST /api/fix-stock/apply - Appliquer les corrections
router.post('/apply', authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🚀 Application des corrections...');

    // Trouver toutes les corrections à faire
    const statusHistories = await prisma.statusHistory.findMany({
      where: {
        oldStatus: 'LIVREE',
        newStatus: {
          in: ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE', 'ASSIGNEE']
        }
      },
      include: {
        order: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const corrected = [];
    const errors = [];

    for (const history of statusHistories) {
      if (!history.order || !history.order.productId || !history.order.product) {
        continue;
      }

      // Vérifier si déjà corrigé
      const returnMovement = await prisma.stockMovement.findFirst({
        where: {
          orderId: history.orderId,
          type: 'RETOUR',
          createdAt: {
            gte: history.createdAt
          }
        }
      });

      if (returnMovement) {
        continue; // Déjà corrigé
      }

      // Appliquer la correction
      try {
        await prisma.$transaction(async (tx) => {
          const product = history.order.product;
          const order = history.order;

          const stockAvant = product.stockActuel;
          const stockApres = stockAvant + order.quantite;

          // Mettre à jour le stock
          await tx.product.update({
            where: { id: product.id },
            data: { stockActuel: stockApres }
          });

          // Créer le mouvement de stock de correction
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: 'RETOUR',
              quantite: order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: req.user.id,
              motif: `🔧 Correction automatique - Stock réajusté suite à changement LIVREE → ${history.newStatus} - ${order.orderReference}`
            }
          });

          corrected.push({
            orderReference: order.orderReference,
            productNom: product.nom,
            stockAvant,
            stockApres,
            quantite: order.quantite
          });

          console.log(`✅ Corrigé: ${product.nom} (${stockAvant} → ${stockApres})`);
        });
      } catch (error) {
        console.error(`❌ Erreur pour ${history.order.orderReference}:`, error.message);
        errors.push({
          orderReference: history.order.orderReference,
          error: error.message
        });
      }
    }

    console.log(`\n✅ ${corrected.length} stock(s) corrigé(s)`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} erreur(s)`);
    }

    res.json({
      success: true,
      corrected: corrected.length,
      errors: errors.length,
      details: {
        corrected,
        errors
      }
    });
  } catch (error) {
    console.error('Erreur application:', error);
    res.status(500).json({ error: 'Erreur lors de l\'application des corrections' });
  }
});

export default router;

