import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stock-analysis/local-reserve - Analyse complète du stock en livraison locale
router.get('/local-reserve', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    // 1. Récupérer toutes les commandes ASSIGNEE (en cours de livraison locale)
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL',
        productId: { not: null }
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
            stockLocalReserve: true,
            stockActuel: true
          }
        },
        deliverer: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true
          }
        },
        deliveryList: {
          select: {
            id: true,
            nom: true,
            date: true
          }
        }
      },
      orderBy: {
        deliveryDate: 'desc'
      }
    });

    // 2. Calculer le stock réel en livraison par produit
    const stockByProduct = {};
    const stockByDeliverer = {};
    const totalOrders = ordersInDelivery.length;
    let totalQuantity = 0;

    ordersInDelivery.forEach(order => {
      const productId = order.productId;
      const delivererId = order.deliverer?.id;

      // Par produit
      if (!stockByProduct[productId]) {
        stockByProduct[productId] = {
          product: order.product,
          quantiteReelle: 0,
          quantiteEnregistree: order.product?.stockLocalReserve || 0,
          commandes: [],
          livreurs: new Set()
        };
      }
      stockByProduct[productId].quantiteReelle += order.quantite;
      stockByProduct[productId].commandes.push({
        id: order.id,
        orderReference: order.orderReference,
        clientNom: order.clientNom,
        clientTelephone: order.clientTelephone,
        clientVille: order.clientVille,
        quantite: order.quantite,
        deliveryDate: order.deliveryDate,
        deliveryList: order.deliveryList,
        deliverer: order.deliverer
      });
      if (delivererId) {
        stockByProduct[productId].livreurs.add(delivererId);
      }

      // Par livreur
      if (delivererId) {
        if (!stockByDeliverer[delivererId]) {
          stockByDeliverer[delivererId] = {
            deliverer: order.deliverer,
            totalQuantite: 0,
            produits: {},
            commandes: []
          };
        }
        stockByDeliverer[delivererId].totalQuantite += order.quantite;
        stockByDeliverer[delivererId].commandes.push({
          id: order.id,
          orderReference: order.orderReference,
          clientNom: order.clientNom,
          produitNom: order.product?.nom,
          quantite: order.quantite,
          deliveryDate: order.deliveryDate
        });

        if (!stockByDeliverer[delivererId].produits[productId]) {
          stockByDeliverer[delivererId].produits[productId] = {
            nom: order.product?.nom,
            quantite: 0
          };
        }
        stockByDeliverer[delivererId].produits[productId].quantite += order.quantite;
      }

      totalQuantity += order.quantite;
    });

    // 3. Détecter les écarts (différences entre stock enregistré et stock réel)
    const ecarts = [];
    Object.values(stockByProduct).forEach(item => {
      const ecart = item.quantiteReelle - item.quantiteEnregistree;
      if (ecart !== 0) {
        ecarts.push({
          productId: item.product.id,
          productNom: item.product.nom,
          productCode: item.product.code,
          quantiteReelle: item.quantiteReelle,
          quantiteEnregistree: item.quantiteEnregistree,
          ecart,
          type: ecart > 0 ? 'MANQUE_EN_BDD' : 'SURPLUS_EN_BDD'
        });
      }
    });

    // 4. Convertir les Sets en nombres
    Object.values(stockByProduct).forEach(item => {
      item.nombreLivreurs = item.livreurs.size;
      delete item.livreurs;
    });

    // 5. Préparer le résumé
    const summary = {
      totalCommandes: totalOrders,
      totalQuantite,
      totalProduitsConcernes: Object.keys(stockByProduct).length,
      totalLivreurs: Object.keys(stockByDeliverer).length,
      totalEcarts: ecarts.length,
      ecartQuantite: ecarts.reduce((sum, e) => sum + Math.abs(e.ecart), 0)
    };

    res.json({
      summary,
      parProduit: Object.values(stockByProduct),
      parLivreur: Object.values(stockByDeliverer),
      ecarts,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur analyse stock local:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse du stock local.' });
  }
});

// POST /api/stock-analysis/recalculate-local-reserve - Recalculer le stock local réservé
router.post('/recalculate-local-reserve', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    // 1. Récupérer toutes les commandes ASSIGNEE par produit
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL',
        productId: { not: null }
      },
      select: {
        productId: true,
        quantite: true
      }
    });

    // 2. Calculer le stock réel en livraison par produit
    const stockByProduct = {};
    ordersInDelivery.forEach(order => {
      if (!stockByProduct[order.productId]) {
        stockByProduct[order.productId] = 0;
      }
      stockByProduct[order.productId] += order.quantite;
    });

    // 3. Mettre à jour chaque produit
    const updates = [];
    for (const [productIdStr, quantite] of Object.entries(stockByProduct)) {
      const productId = parseInt(productIdStr);
      
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (product) {
        const oldStockLocalReserve = product.stockLocalReserve;
        
        if (oldStockLocalReserve !== quantite) {
          await prisma.product.update({
            where: { id: productId },
            data: { stockLocalReserve: quantite }
          });

          // Créer un mouvement de correction si nécessaire
          if (oldStockLocalReserve !== quantite) {
            await prisma.stockMovement.create({
              data: {
                productId,
                type: 'CORRECTION',
                quantite: quantite - oldStockLocalReserve,
                stockAvant: oldStockLocalReserve,
                stockApres: quantite,
                effectuePar: req.user.id,
                motif: `Correction automatique stock local réservé - Ancien: ${oldStockLocalReserve}, Nouveau: ${quantite}`
              }
            });
          }

          updates.push({
            productId,
            productNom: product.nom,
            ancien: oldStockLocalReserve,
            nouveau: quantite,
            ecart: quantite - oldStockLocalReserve
          });
        }
      }
    }

    // 4. Remettre à zéro les produits qui n'ont plus de commandes en livraison
    const allProducts = await prisma.product.findMany({
      where: {
        stockLocalReserve: { gt: 0 }
      }
    });

    for (const product of allProducts) {
      if (!stockByProduct[product.id]) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stockLocalReserve: 0 }
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'CORRECTION',
            quantite: -product.stockLocalReserve,
            stockAvant: product.stockLocalReserve,
            stockApres: 0,
            effectuePar: req.user.id,
            motif: `Correction automatique - Aucune commande en livraison pour ce produit`
          }
        });

        updates.push({
          productId: product.id,
          productNom: product.nom,
          ancien: product.stockLocalReserve,
          nouveau: 0,
          ecart: -product.stockLocalReserve
        });
      }
    }

    res.json({
      message: 'Recalcul terminé avec succès',
      totalCorrections: updates.length,
      corrections: updates,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur recalcul stock local:', error);
    res.status(500).json({ error: 'Erreur lors du recalcul du stock local.' });
  }
});

// GET /api/stock-analysis/deliverer-details/:delivererId - Détails des livraisons en cours pour un livreur
router.get('/deliverer-details/:delivererId', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'LIVREUR'), async (req, res) => {
  try {
    const { delivererId } = req.params;
    const userId = parseInt(delivererId);

    // Vérifier que le livreur accède uniquement à ses propres données
    if (req.user.role === 'LIVREUR' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL',
        delivererId: userId,
        productId: { not: null }
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
            prixUnitaire: true
          }
        },
        deliveryList: {
          select: {
            id: true,
            nom: true,
            date: true
          }
        }
      },
      orderBy: {
        deliveryDate: 'desc'
      }
    });

    // Grouper par produit
    const byProduct = {};
    let totalQuantite = 0;
    let totalValeur = 0;

    orders.forEach(order => {
      const productId = order.productId;
      if (!byProduct[productId]) {
        byProduct[productId] = {
          product: order.product,
          quantite: 0,
          commandes: []
        };
      }
      byProduct[productId].quantite += order.quantite;
      byProduct[productId].commandes.push({
        id: order.id,
        orderReference: order.orderReference,
        clientNom: order.clientNom,
        clientTelephone: order.clientTelephone,
        clientVille: order.clientVille,
        quantite: order.quantite,
        montant: order.montant,
        deliveryDate: order.deliveryDate,
        deliveryList: order.deliveryList
      });

      totalQuantite += order.quantite;
      totalValeur += order.montant;
    });

    res.json({
      delivererId: userId,
      totalCommandes: orders.length,
      totalQuantite,
      totalValeur,
      parProduit: Object.values(byProduct),
      commandes: orders
    });
  } catch (error) {
    console.error('Erreur détails livreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des détails.' });
  }
});

export default router;

