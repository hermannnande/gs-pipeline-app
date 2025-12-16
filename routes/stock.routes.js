import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stock/tournees - Liste des tournées pour gestion stock
router.get('/tournees', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { date, dateDebut, dateFin, delivererId, status } = req.query;

    const where = {};
    
    // Gestion de la plage de dates
    if (dateDebut && dateFin) {
      // Plage de dates
      const startDate = new Date(`${dateDebut}T00:00:00.000Z`);
      const endDate = new Date(`${dateFin}T23:59:59.999Z`);
      where.date = { gte: startDate, lte: endDate };
    } else if (dateDebut) {
      // Date de début uniquement
      const startDate = new Date(`${dateDebut}T00:00:00.000Z`);
      where.date = { gte: startDate };
    } else if (dateFin) {
      // Date de fin uniquement
      const endDate = new Date(`${dateFin}T23:59:59.999Z`);
      where.date = { lte: endDate };
    } else if (date) {
      // Ancien format : une seule date (pour rétrocompatibilité)
      const selectedDate = new Date(`${date}T00:00:00.000Z`);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: selectedDate, lt: nextDay };
    }
    
    if (delivererId) where.delivererId = parseInt(delivererId);

    const deliveryLists = await prisma.deliveryList.findMany({
      where,
      include: {
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        orders: {
          include: {
            product: true
          }
        },
        tourneeStock: true
      },
      orderBy: { createdAt: 'desc' } // Tri par date de création (les plus récentes en premier)
    });

    // Calculer les statistiques pour chaque tournée
    const now = new Date();
    const tourneesWithStats = deliveryLists.map(list => {
      const totalOrders = list.orders.length;
      const livrees = list.orders.filter(o => o.status === 'LIVREE').length;
      const refusees = list.orders.filter(o => o.status === 'REFUSEE').length;
      const annulees = list.orders.filter(o => o.status === 'ANNULEE_LIVRAISON').length;
      const enAttente = list.orders.filter(o => o.status === 'ASSIGNEE').length;
      const colisRemis = list.tourneeStock?.colisRemis || totalOrders;
      
      // Calcul de la durée des colis chez le livreur
      let joursChezLivreur = 0;
      let dateRemise = list.tourneeStock?.colisRemisAt || list.createdAt || list.date;
      if (dateRemise && !list.tourneeStock?.colisRetourConfirme) {
        const diffTime = now.getTime() - new Date(dateRemise).getTime();
        joursChezLivreur = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Colis restants (non livrés et non retournés)
      const colisRestants = list.tourneeStock?.colisRetourConfirme 
        ? 0 
        : (colisRemis - livrees);
      
      // Alertes
      const alerteRetard = joursChezLivreur > 2 && colisRestants > 0; // Plus de 2 jours
      const alerteCritique = joursChezLivreur > 5 && colisRestants > 0; // Plus de 5 jours

      return {
        ...list,
        stats: {
          totalOrders,
          livrees,
          refusees,
          annulees,
          enAttente,
          colisRemis,
          colisRetour: list.tourneeStock?.colisRetour || 0,
          colisRestants,
          remisConfirme: list.tourneeStock?.colisRemisConfirme || false,
          retourConfirme: list.tourneeStock?.colisRetourConfirme || false,
          dateRemise: list.tourneeStock?.colisRemisAt || list.createdAt,
          dateRetour: list.tourneeStock?.colisRetourAt,
          joursChezLivreur,
          alerteRetard,
          alerteCritique
        }
      };
    });

    res.json({ tournees: tourneesWithStats });
  } catch (error) {
    console.error('Erreur récupération tournées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tournées.' });
  }
});

// GET /api/stock/tournees/:id - Détail d'une tournée
router.get('/tournees/:id', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: {
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        orders: {
          include: {
            product: true
          }
        },
        tourneeStock: {
          include: {
            stockMovements: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    // Calculer les produits par tournée
    const produitsSummary = {};
    deliveryList.orders.forEach(order => {
      const key = order.productId || order.produitNom;
      if (!produitsSummary[key]) {
        produitsSummary[key] = {
          productId: order.productId,
          produitNom: order.produitNom,
          quantiteTotal: 0,
          quantiteLivree: 0,
          quantiteRetour: 0,
          quantiteEnCours: 0
        };
      }
      produitsSummary[key].quantiteTotal += order.quantite;
      if (order.status === 'LIVREE') {
        produitsSummary[key].quantiteLivree += order.quantite;
      } else if (['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(order.status)) {
        produitsSummary[key].quantiteRetour += order.quantite;
      } else if (order.status === 'ASSIGNEE') {
        produitsSummary[key].quantiteEnCours += order.quantite;
      }
    });
    
    // Calcul des durées et statistiques détaillées
    const now = new Date();
    const dateRemise = deliveryList.tourneeStock?.colisRemisAt || deliveryList.createdAt || deliveryList.date;
    const dateRetour = deliveryList.tourneeStock?.colisRetourAt;
    
    let joursChezLivreur = 0;
    if (dateRemise && !dateRetour) {
      const diffTime = now.getTime() - new Date(dateRemise).getTime();
      joursChezLivreur = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const colisRemis = deliveryList.tourneeStock?.colisRemis || deliveryList.orders.length;
    const colisLivres = deliveryList.orders.filter(o => o.status === 'LIVREE').length;
    const colisRestants = dateRetour ? 0 : (colisRemis - colisLivres);
    
    res.json({ 
      tournee: deliveryList,
      produitsSummary: Object.values(produitsSummary),
      stats: {
        colisRemis,
        colisLivres,
        colisRetour: deliveryList.tourneeStock?.colisRetour || 0,
        colisRestants,
        dateRemise,
        dateRetour,
        joursChezLivreur,
        alerteRetard: joursChezLivreur > 2 && colisRestants > 0,
        alerteCritique: joursChezLivreur > 5 && colisRestants > 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération détail tournée:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la tournée.' });
  }
});

// POST /api/stock/tournees/:id/confirm-remise - Confirmer la remise des colis
router.post('/tournees/:id/confirm-remise', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('colisRemis').isInt({ min: 0 }).withMessage('Nombre de colis invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { colisRemis } = req.body;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: { 
        orders: {
          include: { product: true }
        },
        tourneeStock: true
      }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    // Vérifier si c'est la première confirmation (pour déplacer le stock)
    const isFirstConfirmation = !deliveryList.tourneeStock?.colisRemisConfirme;

    // ⚡ TRANSACTION : Créer TourneeStock ET déplacer le stock vers stockLocalReserve
    const result = await prisma.$transaction(async (tx) => {
      // Créer ou mettre à jour TourneeStock
      const tourneeStock = await tx.tourneeStock.upsert({
        where: { deliveryListId: parseInt(id) },
        create: {
          deliveryListId: parseInt(id),
          colisRemis: parseInt(colisRemis),
          colisRemisConfirme: true,
          colisRemisAt: new Date(),
          colisRemisBy: req.user.id
        },
        update: {
          colisRemis: parseInt(colisRemis),
          colisRemisConfirme: true,
          colisRemisAt: new Date(),
          colisRemisBy: req.user.id
        }
      });

      // ⚡ DÉPLACER LE STOCK : stockActuel → stockLocalReserve
      // UNIQUEMENT si c'est la première confirmation
      const stockMovements = [];
      if (isFirstConfirmation) {
        for (const order of deliveryList.orders) {
          if (order.productId && order.deliveryType === 'LOCAL' && order.product) {
            const product = order.product;
            const stockActuelAvant = product.stockActuel;
            const stockLocalReserveAvant = product.stockLocalReserve;
            const stockActuelApres = stockActuelAvant - order.quantite;
            const stockLocalReserveApres = stockLocalReserveAvant + order.quantite;

            // Mettre à jour les deux stocks
            await tx.product.update({
              where: { id: order.productId },
              data: { 
                stockActuel: stockActuelApres,
                stockLocalReserve: stockLocalReserveApres
              }
            });

            // Créer le mouvement de réservation locale
            const movement = await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'RESERVATION_LOCAL',
                quantite: order.quantite,
                stockAvant: stockActuelAvant,
                stockApres: stockActuelApres,
                orderId: order.id,
                tourneeId: tourneeStock.id,
                effectuePar: req.user.id,
                motif: `Remise colis tournée ${deliveryList.nom} - ${order.orderReference} - ${order.clientNom}`
              }
            });
            stockMovements.push(movement);
          }
        }
      }

      return { tourneeStock, stockMovements };
    });

    res.json({ 
      tourneeStock: result.tourneeStock, 
      stockMovements: result.stockMovements,
      message: isFirstConfirmation 
        ? `${colisRemis} colis confirmés pour la remise. Stock déplacé vers "En livraison".`
        : `${colisRemis} colis confirmés pour la remise (mise à jour).` 
    });
  } catch (error) {
    console.error('Erreur confirmation remise:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de remise.' });
  }
});

// POST /api/stock/tournees/:id/confirm-retour - Confirmer le retour des colis
router.post('/tournees/:id/confirm-retour', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('colisRetour').isInt({ min: 0 }).withMessage('Nombre de colis invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { colisRetour, ecartMotif, raisonsRetour } = req.body;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          include: { product: true }
        },
        tourneeStock: true
      }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    // Calculer les colis livrés
    const colisLivres = deliveryList.orders.filter(o => o.status === 'LIVREE').length;
    const colisRemis = deliveryList.tourneeStock?.colisRemis || deliveryList.orders.length;
    const ecart = colisRemis - (colisLivres + parseInt(colisRetour));

    // Transaction pour tout traiter ensemble
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour TourneeStock
      const tourneeStock = await tx.tourneeStock.update({
        where: { deliveryListId: parseInt(id) },
        data: {
          colisLivres,
          colisRetour: parseInt(colisRetour),
          colisRetourConfirme: true,
          colisRetourAt: new Date(),
          colisRetourBy: req.user.id,
          ecart,
          ecartResolu: ecart === 0,
          ecartMotif: ecart !== 0 ? ecartMotif : null
        }
      });

      // Mettre à jour les colis REFUSEE et ANNULEE_LIVRAISON vers RETOURNE avec raison
      if (raisonsRetour && typeof raisonsRetour === 'object') {
        const ordersToUpdate = deliveryList.orders.filter(o => 
          ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(o.status) && 
          raisonsRetour[o.id]
        );

        for (const order of ordersToUpdate) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'RETOURNE',
              raisonRetour: raisonsRetour[order.id],
              retourneAt: new Date()
            }
          });

          // Créer l'historique
          await tx.statusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: order.status,
              newStatus: 'RETOURNE',
              changedBy: req.user.id,
              comment: `Retour confirmé par gestionnaire de stock - Raison: ${raisonsRetour[order.id]}`
            }
          });
        }
      }

      // ⚡ RETOURNER LE STOCK : stockLocalReserve → stockActuel
      // Pour chaque commande NON livrée (REFUSEE, ANNULEE_LIVRAISON, RETOURNE, ASSIGNEE)
      const stockMovements = [];
      const ordersToReturn = deliveryList.orders.filter(o => 
        !['LIVREE'].includes(o.status) && o.productId && o.deliveryType === 'LOCAL'
      );

      for (const order of ordersToReturn) {
        if (order.product) {
          const product = order.product;
          const stockActuelAvant = product.stockActuel;
          const stockLocalReserveAvant = product.stockLocalReserve;
          const stockActuelApres = stockActuelAvant + order.quantite;
          const stockLocalReserveApres = stockLocalReserveAvant - order.quantite;

          // Mettre à jour les deux stocks
          await tx.product.update({
            where: { id: order.productId },
            data: { 
              stockActuel: stockActuelApres,
              stockLocalReserve: stockLocalReserveApres
            }
          });

          // Créer le mouvement de retour local
          const movement = await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'RETOUR_LOCAL',
              quantite: order.quantite,
              stockAvant: stockActuelAvant,
              stockApres: stockActuelApres,
              orderId: order.id,
              tourneeId: tourneeStock.id,
              effectuePar: req.user.id,
              motif: `Retour tournée ${deliveryList.nom} - ${order.orderReference} - ${order.status} - ${order.clientNom}`
            }
          });
          stockMovements.push(movement);
        }
      }

      return { tourneeStock, movements: stockMovements };
    });

    res.json({ 
      ...result,
      message: `Retour confirmé : ${colisRetour} colis retournés.${ecart !== 0 ? ` Écart de ${ecart} colis.` : ''}` 
    });
  } catch (error) {
    console.error('Erreur confirmation retour:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de retour.' });
  }
});

// GET /api/stock/movements - Historique des mouvements de stock
router.get('/movements', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = 100 } = req.query;

    const where = {};
    if (productId) where.productId = parseInt(productId);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        tournee: {
          include: {
            deliveryList: {
              include: {
                deliverer: {
                  select: { nom: true, prenom: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ movements });
  } catch (error) {
    console.error('Erreur récupération mouvements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des mouvements.' });
  }
});

// GET /api/stock/stats - Statistiques de stock
router.get('/stats', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [
      totalProduits,
      produitsActifs,
      allProducts,
      totalLivraisons,
      totalRetours,
      stockTotal
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { actif: true } }),
      prisma.product.findMany({
        where: { actif: true },
        select: { stockActuel: true, stockAlerte: true }
      }),
      prisma.stockMovement.count({
        where: { ...dateFilter, type: 'LIVRAISON' }
      }),
      prisma.stockMovement.count({
        where: { ...dateFilter, type: 'RETOUR' }
      }),
      prisma.product.aggregate({
        where: { actif: true },
        _sum: { stockActuel: true }
      })
    ]);

    // Compter les produits en alerte (stock <= stock d'alerte)
    const produitsAlerteStock = allProducts.filter(p => p.stockActuel <= p.stockAlerte).length;

    res.json({
      stats: {
        totalProduits,
        produitsActifs,
        produitsAlerteStock,
        totalLivraisons,
        totalRetours,
        stockTotal: stockTotal._sum.stockActuel || 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats stock:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

export default router;

