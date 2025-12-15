import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stock-analysis/local-reserve - Analyse complète du stock en livraison locale
router.get('/local-reserve', authorize('ADMIN'), async (req, res) => {
  try {
    // 1. Récupérer toutes les commandes qui sont physiquement avec les livreurs
    // ASSIGNEE = En cours de livraison
    // REFUSEE = Refusé par client, produit encore avec livreur
    // ANNULEE_LIVRAISON = Annulé en livraison, produit encore avec livreur
    // RETOURNE = En cours de retour, produit encore avec livreur
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        status: { in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'] },
        deliveryType: 'LOCAL',
        productId: { not: null },
        delivererId: { not: null }, // S'assurer qu'il y a bien un livreur assigné
        NOT: {
          // Exclure les colis dont le retour a déjà été confirmé par le gestionnaire de stock
          deliveryList: {
            tourneeStock: {
              colisRemisConfirme: true
            }
          }
        }
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
            date: true,
            tourneeStock: {
              select: {
                colisRemisConfirme: true
              }
            }
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
        status: order.status,
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
          status: order.status,
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
      totalQuantite: totalQuantity,
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
router.post('/recalculate-local-reserve', authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🔄 Début du recalcul du stock local réservé...');
    
    // 1. Récupérer toutes les commandes physiquement avec les livreurs (pas encore livrées)
    // Inclut: ASSIGNEE, REFUSEE, ANNULEE_LIVRAISON, RETOURNE
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        status: { in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'] },
        deliveryType: 'LOCAL',
        productId: { not: null },
        delivererId: { not: null },
        NOT: {
          deliveryList: {
            tourneeStock: {
              colisRemisConfirme: true
            }
          }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            nom: true,
            code: true
          }
        },
        deliverer: {
          select: {
            nom: true,
            prenom: true
          }
        },
        deliveryList: {
          select: {
            tourneeStock: {
              select: {
                colisRemisConfirme: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 ${ordersInDelivery.length} commandes avec livreurs trouvées (ASSIGNEE, REFUSEE, ANNULEE_LIVRAISON, RETOURNE)`);

    // 2. Calculer le stock réel en livraison par produit
    const stockByProduct = {};
    ordersInDelivery.forEach(order => {
      if (!stockByProduct[order.productId]) {
        stockByProduct[order.productId] = {
          quantite: 0,
          nom: order.product.nom,
          code: order.product.code,
          commandes: []
        };
      }
      stockByProduct[order.productId].quantite += order.quantite;
      stockByProduct[order.productId].commandes.push({
        ref: order.orderReference,
        quantite: order.quantite,
        livreur: order.deliverer ? `${order.deliverer.prenom} ${order.deliverer.nom}` : 'N/A'
      });
    });

    console.log(`📊 ${Object.keys(stockByProduct).length} produits différents concernés`);

    // 3. Mettre à jour chaque produit
    const updates = [];
    for (const [productIdStr, data] of Object.entries(stockByProduct)) {
      const productId = parseInt(productIdStr);
      
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (product) {
        const oldStockLocalReserve = product.stockLocalReserve || 0;
        const newStockLocalReserve = data.quantite;
        
        if (oldStockLocalReserve !== newStockLocalReserve) {
          await prisma.product.update({
            where: { id: productId },
            data: { stockLocalReserve: newStockLocalReserve }
          });

          // Créer un mouvement de correction
          await prisma.stockMovement.create({
            data: {
              productId,
              type: 'CORRECTION',
              quantite: newStockLocalReserve - oldStockLocalReserve,
              stockAvant: oldStockLocalReserve,
              stockApres: newStockLocalReserve,
              effectuePar: req.user.id,
              motif: `Synchronisation stock local - ${data.commandes.length} commande(s) en livraison`
            }
          });

          console.log(`✅ ${data.nom}: ${oldStockLocalReserve} → ${newStockLocalReserve}`);

          updates.push({
            productId,
            productNom: data.nom,
            productCode: data.code,
            ancien: oldStockLocalReserve,
            nouveau: newStockLocalReserve,
            ecart: newStockLocalReserve - oldStockLocalReserve,
            commandes: data.commandes
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
            motif: `Réinitialisation - Aucune commande ASSIGNEE pour ce produit`
          }
        });

        console.log(`🔄 ${product.nom}: ${product.stockLocalReserve} → 0 (plus de commandes)`);

        updates.push({
          productId: product.id,
          productNom: product.nom,
          ancien: product.stockLocalReserve,
          nouveau: 0,
          ecart: -product.stockLocalReserve
        });
      }
    }

    console.log(`✅ Recalcul terminé: ${updates.length} correction(s)`);

    res.json({
      message: updates.length > 0 
        ? `${updates.length} correction(s) effectuée(s) avec succès` 
        : 'Aucune correction nécessaire - Les données sont déjà à jour',
      totalCorrections: updates.length,
      totalCommandesAnalysees: ordersInDelivery.length,
      corrections: updates,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Erreur recalcul stock local:', error);
    res.status(500).json({ error: 'Erreur lors du recalcul du stock local.' });
  }
});

// GET /api/stock-analysis/deliverer-details/:delivererId - Détails des livraisons en cours pour un livreur
router.get('/deliverer-details/:delivererId', authorize('ADMIN', 'LIVREUR'), async (req, res) => {
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

