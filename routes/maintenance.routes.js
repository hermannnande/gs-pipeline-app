import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { computeTotalAmount } from '../utils/pricing.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/maintenance/fix-order-amounts - Recalculer les montants selon packs quantité
// Admin uniquement. Utile pour corriger les commandes déjà existantes.
// Body:
// - dryRun: boolean (default true) -> si true, ne modifie pas la BDD
// - statuses: string[] (optionnel) -> limiter aux statuts (ex: ['NOUVELLE','A_APPELER','VALIDEE'])
router.post('/fix-order-amounts', authorize('ADMIN'), async (req, res) => {
  try {
    const dryRun = req.body?.dryRun !== undefined ? !!req.body.dryRun : true;
    const statuses = Array.isArray(req.body?.statuses) ? req.body.statuses : null;

    const where = {
      productId: { not: null },
    };
    if (statuses?.length) where.status = { in: statuses };

    const orders = await prisma.order.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const changes = [];

    for (const order of orders) {
      const unitPrice = Number(order.product?.prixUnitaire) || 0;
      const expected = computeTotalAmount(unitPrice, order.quantite || 1);

      if (Number(order.montant) !== Number(expected)) {
        const newMontantRestant =
          order.montantRestant != null
            ? Math.max(0, expected - (order.montantPaye || 0))
            : null;

        changes.push({
          id: order.id,
          ref: order.orderReference,
          produit: order.produitNom,
          quantite: order.quantite,
          avant: order.montant,
          apres: expected,
        });

        if (!dryRun) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              montant: expected,
              montantRestant: newMontantRestant,
            },
          });

          await prisma.statusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: order.status,
              newStatus: order.status,
              changedBy: req.user.id,
              comment: `Correction automatique montant (packs quantité): ${order.montant} → ${expected} (qte=${order.quantite}, prixU=${unitPrice})`,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      dryRun,
      totalChecked: orders.length,
      totalToFix: changes.length,
      changes: changes.slice(0, 200),
      message: dryRun
        ? `Dry-run: ${changes.length} commande(s) détectée(s) à corriger (affichage).`
        : `✅ ${changes.length} commande(s) corrigée(s) en base.`,
    });
  } catch (error) {
    console.error('Erreur recalcul montants commandes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du recalcul des montants.',
      details: error.message,
    });
  }
});

// POST /api/maintenance/fix-stock-local-reserve - Recalculer le stock en livraison
router.post('/fix-stock-local-reserve', authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🔍 Début de l\'analyse du stock en livraison...');

    // 1. Trouver TOUS les produits avec leurs commandes en livraison
    const allProducts = await prisma.product.findMany({
      include: {
        orders: {
          where: {
            status: 'ASSIGNEE',
            deliveryType: 'LOCAL'
          },
          include: {
            deliverer: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 ${allProducts.length} produit(s) analysé(s).`);

    const productsToFix = [];

    // 2. Pour chaque produit, calculer le stock réel en livraison
    for (const product of allProducts) {
      // Calculer le stock LOCAL RÉEL basé sur les commandes ASSIGNEE
      const realStockLocalReserve = product.orders.reduce((sum, order) => {
        return sum + (order.quantite || 0);
      }, 0);

      const currentStockLocalReserve = product.stockLocalReserve || 0;

      // Si différence détectée
      if (realStockLocalReserve !== currentStockLocalReserve) {
        productsToFix.push({
          productId: product.id,
          code: product.code,
          nom: product.nom,
          currentStock: currentStockLocalReserve,
          realStock: realStockLocalReserve,
          difference: realStockLocalReserve - currentStockLocalReserve,
          ordersInDelivery: product.orders.map(o => ({
            reference: o.orderReference,
            quantite: o.quantite,
            livreur: o.deliverer 
              ? `${o.deliverer.nom} ${o.deliverer.prenom}` 
              : 'Non assigné'
          }))
        });
      }
    }

    if (productsToFix.length === 0) {
      return res.json({
        success: true,
        message: '✅ Aucune incohérence détectée. Tous les stocks en livraison sont corrects.',
        productsFixed: []
      });
    }

    console.log(`⚠️  ${productsToFix.length} produit(s) avec incohérence détecté(s).`);

    // 3. Corriger chaque produit
    const corrections = [];
    for (const item of productsToFix) {
      console.log(`🔧 Correction de [${item.code}] ${item.nom}...`);

      await prisma.product.update({
        where: { id: item.productId },
        data: { stockLocalReserve: item.realStock }
      });

      // Créer un mouvement de stock pour tracer la correction
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'CORRECTION',
          quantite: item.difference,
          stockAvant: item.currentStock,
          stockApres: item.realStock,
          effectuePar: req.user.id,
          motif: `Recalcul automatique du stockLocalReserve basé sur les commandes ASSIGNEE réelles. Correction de l'incohérence suite au bug de double logique (${item.currentStock} → ${item.realStock}).`
        }
      });

      corrections.push({
        code: item.code,
        nom: item.nom,
        avant: item.currentStock,
        apres: item.realStock,
        difference: item.difference,
        commandes: item.ordersInDelivery
      });

      console.log(`   ✅ ${item.currentStock} → ${item.realStock} (${item.difference > 0 ? '+' : ''}${item.difference})`);
    }

    console.log('\n✅ Correction terminée avec succès!');

    res.json({
      success: true,
      message: `✅ ${corrections.length} produit(s) corrigé(s) avec succès.`,
      productsFixed: corrections
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la correction du stock en livraison.',
      details: error.message 
    });
  }
});

// GET /api/maintenance/check-stock-coherence - Vérifier la cohérence du stock (sans corriger)
router.get('/check-stock-coherence', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    // Analyser tous les produits
    const allProducts = await prisma.product.findMany({
      include: {
        orders: {
          where: {
            status: 'ASSIGNEE',
            deliveryType: 'LOCAL'
          },
          include: {
            deliverer: {
              select: {
                nom: true,
                prenom: true
              }
            }
          }
        }
      }
    });

    const incoherences = [];

    for (const product of allProducts) {
      const realStockLocalReserve = product.orders.reduce((sum, order) => {
        return sum + (order.quantite || 0);
      }, 0);

      const currentStockLocalReserve = product.stockLocalReserve || 0;

      if (realStockLocalReserve !== currentStockLocalReserve) {
        incoherences.push({
          code: product.code,
          nom: product.nom,
          stockBDD: currentStockLocalReserve,
          stockReel: realStockLocalReserve,
          difference: realStockLocalReserve - currentStockLocalReserve,
          nbCommandes: product.orders.length,
          commandes: product.orders.map(o => ({
            reference: o.orderReference,
            quantite: o.quantite,
            livreur: o.deliverer 
              ? `${o.deliverer.nom} ${o.deliverer.prenom}` 
              : 'Non assigné'
          }))
        });
      }
    }

    res.json({
      success: true,
      coherent: incoherences.length === 0,
      totalProduits: allProducts.length,
      produitsIncoherents: incoherences.length,
      incoherences
    });

  } catch (error) {
    console.error('Erreur vérification cohérence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la vérification de la cohérence.'
    });
  }
});

export default router;

