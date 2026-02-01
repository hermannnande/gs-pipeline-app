import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { notifyOrderValidated, notifyOrderDelivered, notifyOrderRefused } from '../utils/notifications.js';
import { computeTotalAmount } from '../utils/pricing.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Toutes les routes nécessitent authentification
router.use(authenticate);

// GET /api/orders - Liste des commandes (avec filtres selon rôle)
router.get('/', async (req, res) => {
  try {
    const { status, ville, produit, startDate, endDate, callerId, delivererId, deliveryType, page = 1, limit = 1000 } = req.query;
    const user = req.user;

    const where = {};

    // Filtres selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant voit :
      // 1. UNIQUEMENT les commandes NOUVELLE et A_APPELER (en attente d'appel)
      // 2. TOUTES les EXPÉDITIONS et EXPRESS (pour gestion)
      where.OR = [
        { status: { in: ['NOUVELLE', 'A_APPELER'] } },
        { deliveryType: 'EXPEDITION' },
        { deliveryType: 'EXPRESS' }
      ];
    } else if (user.role === 'LIVREUR') {
      // Le livreur voit uniquement ses commandes assignées
      where.delivererId = user.id;
    } else if (user.role === 'GESTIONNAIRE' || user.role === 'GESTIONNAIRE_STOCK') {
      // Le gestionnaire et gestionnaire de stock voient toutes les commandes
      // (pas de restriction)
    } else if (user.role === 'ADMIN') {
      // L'admin voit tout (pas de restriction)
    }

    // Filtres supplémentaires
    // Compat: pour un APPELANT, "À appeler" = NOUVELLE + A_APPELER.
    // (Sinon, un filtre status=A_APPELER masque toutes les NOUVELLE.)
    if (status) {
      if (user.role === 'APPELANT' && status === 'A_APPELER') {
        where.status = { in: ['NOUVELLE', 'A_APPELER'] };
      } else {
        where.status = status;
      }
    }
    if (ville) where.clientVille = { contains: ville, mode: 'insensitive' };
    if (produit) where.produitNom = { contains: produit, mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId);
    if (delivererId) where.delivererId = parseInt(delivererId);
    if (deliveryType) where.deliveryType = deliveryType; // ✅ Appliquer le filtre deliveryType
    
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
          },
          product: {
            select: { 
              id: true, 
              code: true, 
              nom: true, 
              prixUnitaire: true,
              prix2Unites: true,
              prix3Unites: true
            }
          }
        },
        orderBy: [
          { priorite: 'desc' }, // Priorité d'abord
          { createdAt: 'desc' } // Puis les plus récentes
        ],
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

// POST /api/orders/:id/marquer-appel - Marquer qu'un appel est en cours (sans changer le statut)
router.post('/:id/marquer-appel', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Incrémenter le compteur d'appels et assigner l'appelant
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        nombreAppels: { increment: 1 },
        callerId: order.callerId || user.id, // Assigner l'appelant si pas déjà assigné
        calledAt: order.calledAt || new Date() // Marquer la date du premier appel
      },
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        }
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Appel marqué avec succès.' 
    });
  } catch (error) {
    console.error('Erreur marquer appel:', error);
    res.status(500).json({ error: 'Erreur lors du marquage de l\'appel.' });
  }
});

// POST /api/orders/:id/toggle-priorite - Basculer la priorité d'une commande (ADMIN uniquement)
router.post('/:id/toggle-priorite', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Basculer la priorité
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        priorite: !order.priorite,
        prioriteAt: !order.priorite ? new Date() : null,
        prioritePar: !order.priorite ? user.id : null
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: updatedOrder.priorite ? 'Commande mise en priorité.' : 'Priorité retirée.'
    });
  } catch (error) {
    console.error('Erreur toggle priorité:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la priorité.' });
  }
});

// PUT /api/orders/:id/status - Changer le statut d'une commande
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, raisonRetour } = req.body;
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
          data: { 
            callerId: user.id, 
            calledAt: new Date()
          }
        });
      }
    } else if (user.role === 'LIVREUR') {
      // Le livreur peut changer : ASSIGNEE -> LIVREE/REFUSEE/ANNULEE_LIVRAISON/RETOURNE
      if (!['LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un livreur.' });
      }
      if (order.delivererId !== user.id) {
        return res.status(403).json({ error: 'Cette commande ne vous est pas assignée.' });
      }

      // ✅ Garde-fou anti désynchronisation:
      // Pour LOCAL, on force la confirmation de REMISE avant que le livreur puisse changer le statut.
      // Sinon le stockLocalReserve n'a jamais été alimenté -> LIVREE peut le rendre négatif.
      if (order.deliveryType === 'LOCAL') {
        if (!order.deliveryListId) {
          return res.status(400).json({
            error: 'Commande LOCAL sans tournée associée. Veuillez contacter le gestionnaire.'
          });
        }

        const tourneeStock = await prisma.tourneeStock.findUnique({
          where: { deliveryListId: order.deliveryListId }
        });

        if (!tourneeStock?.colisRemisConfirme) {
          return res.status(400).json({
            error: 'Remise non confirmée. Le gestionnaire de stock doit confirmer la REMISE avant toute mise à jour par le livreur.'
          });
        }
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
          deliveredAt: status === 'LIVREE' ? new Date() : order.deliveredAt,
          raisonRetour: status === 'RETOURNE' && raisonRetour ? raisonRetour : order.raisonRetour,
          retourneAt: status === 'RETOURNE' ? new Date() : order.retourneAt
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

      // ⚠️ STOCK : Le stock NE se déplace PAS lors de l'assignation
      // Le stock se déplacera UNIQUEMENT lors de la confirmation de REMISE
      // par le gestionnaire de stock (voir routes/stock.routes.js ligne 207)

      // RÈGLE MÉTIER 1 : Décrémenter le stock quand la commande passe à LIVRÉE
      if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          // 📦 LOCAL : Si le colis était chez le livreur (peu importe le statut), réduire stockLocalReserve
          if (order.deliveryType === 'LOCAL') {
            // Liste des statuts où le colis est chez le livreur
            // Aligné avec la logique RETOUR (routes/stock.routes.js ligne 420)
            const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
            
            if (statusAvecLivreur.includes(order.status)) {
              // ✅ Le colis était chez le livreur, réduire stockLocalReserve
          const stockLocalReserveAvant = product.stockLocalReserve;
              const stockLocalReserveApres = stockLocalReserveAvant - order.quantite;

          await tx.product.update({
            where: { id: order.productId },
                data: { stockLocalReserve: stockLocalReserveApres }
              });

              await tx.stockMovement.create({
            data: { 
                  productId: order.productId,
                  type: 'LIVRAISON_LOCAL',
                  quantite: -order.quantite,
                  stockAvant: stockLocalReserveAvant,
                  stockApres: stockLocalReserveApres,
                  orderId: order.id,
                  effectuePar: user.id,
                  motif: `Livraison locale ${order.orderReference} - ${order.status} → LIVREE - ${order.clientNom}`
                }
              });
            } else {
              // Cas rare : LOCAL → LIVREE sans passer par les statuts avec livreur
              // Cela peut arriver si la commande n'a pas encore été remise (pas de REMISE confirmée)
              console.warn(`Commande ${order.orderReference} : LOCAL → LIVREE depuis statut ${order.status} (pas de REMISE préalable détectée)`);
            }
          }
          // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
          else if (order.deliveryType === 'EXPEDITION') {
            // ✅ Pas de réduction de stock pour EXPEDITION (déjà réduit lors du paiement 100%)
            // La route POST /api/orders/:id/expedition/livrer gère la confirmation de livraison
            // sans toucher au stock
          }
          // ⚡ EXPRESS : Géré par route dédiée
          else if (order.deliveryType === 'EXPRESS') {
            // ✅ EXPRESS géré par route dédiée /api/orders/:id/express/finaliser
            // Le stock est dans stockExpress, pas dans stockActuel
          }
          // 🔹 Autres types (ne devrait pas arriver normalement)
          else {
            // Réduire stockActuel pour les cas non gérés spécifiquement
            const stockAvant = product.stockActuel;
            const stockApres = stockAvant - order.quantite;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockActuel: stockApres }
            });

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
      }

      // ⚠️ NOTE : Le stock ne bouge PAS ici lors du changement de statut par le livreur
      // Le stock revient UNIQUEMENT lors de la confirmation de retour par le gestionnaire de stock

      // RÈGLE MÉTIER 2 : Réincrémenter le stock si la commande était LIVRÉE et change vers un autre statut
      // (Le livreur corrige son erreur dans les 24h : la livraison n'a pas été effectuée)
      if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          // 📦 LOCAL : Remettre dans stockLocalReserve (le colis est encore chez le livreur)
          if (order.deliveryType === 'LOCAL') {
            const stockLocalReserveAvant = product.stockLocalReserve;
            const stockLocalReserveApres = stockLocalReserveAvant + order.quantite;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockLocalReserve: stockLocalReserveApres }
            });

            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION_LIVRAISON_LOCAL',
                quantite: order.quantite, // Positif car on rajoute
                stockAvant: stockLocalReserveAvant,
                stockApres: stockLocalReserveApres,
                orderId: order.id,
                effectuePar: user.id,
                motif: `Correction livraison LOCAL ${order.orderReference} - ${order.status} → ${status} (< 24h) - Colis encore chez livreur - ${order.clientNom}`
              }
            });
          }
          // 📮 EXPEDITION : Remettre dans stockActuel (le colis peut revenir)
          else if (order.deliveryType === 'EXPEDITION') {
          const stockAvant = product.stockActuel;
            const stockApres = stockAvant + order.quantite;

          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
                type: 'RETOUR_EXPEDITION',
                quantite: order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
                motif: `Correction EXPEDITION ${order.orderReference} - ${order.status} → ${status} (< 24h) - ${order.clientNom}`
            }
          });
          }
          // ⚡ EXPRESS : Remettre dans stockExpress
          else if (order.deliveryType === 'EXPRESS') {
            const stockExpressAvant = product.stockExpress || 0;
            const stockExpressApres = stockExpressAvant + order.quantite;

            await tx.product.update({
              where: { id: order.productId },
              data: { stockExpress: stockExpressApres }
            });

            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION_EXPRESS',
                quantite: order.quantite,
                stockAvant: stockExpressAvant,
                stockApres: stockExpressApres,
                orderId: order.id,
                effectuePar: user.id,
                motif: `Correction EXPRESS ${order.orderReference} - ${order.status} → ${status} (< 24h) - ${order.clientNom}`
              }
            });
          }
          // 🔹 Autres types : Comportement par défaut (stockActuel)
          else {
          const stockAvant = product.stockActuel;
            const stockApres = stockAvant + order.quantite;

          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'RETOUR',
                quantite: order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
              motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
            }
          });
          }
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

    // 🔔 Envoyer les notifications selon le nouveau statut
    try {
      // Commande validée par un appelant
      if (status === 'VALIDEE' && order.status !== 'VALIDEE') {
        notifyOrderValidated(updatedOrder, user);
      }
      
      // Commande livrée par un livreur
      if (status === 'LIVREE' && order.status !== 'LIVREE') {
        if (updatedOrder.deliverer) {
          notifyOrderDelivered(updatedOrder, updatedOrder.deliverer);
        }
      }
      
      // Commande refusée par un livreur
      if (status === 'REFUSEE' && order.status !== 'REFUSEE') {
        if (updatedOrder.deliverer) {
          notifyOrderRefused(updatedOrder, updatedOrder.deliverer);
        }
      }
    } catch (notifError) {
      console.error('⚠️ Erreur envoi notification:', notifError);
      // Ne pas bloquer la mise à jour si la notification échoue
    }

    res.json({ order: updatedOrder, message: 'Statut mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// Fonction helper pour mettre à jour les statistiques
async function updateStatistics(userId, role, oldStatus, newStatus, montant) {
  // Statistiques journalières (borne du jour)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (role === 'APPELANT') {
    // Statistiques des appelants
    const stat = await prisma.callStatistic.findFirst({
      where: {
        userId,
        date: { gte: todayStart, lt: tomorrowStart }
      },
      orderBy: { date: 'desc' }
    });

    // On compte un "appel" uniquement quand l'appelant produit un résultat (VALIDEE / ANNULEE / INJOIGNABLE).
    // Si correction entre résultats, on ajuste (décrément ancien, incrément nouveau) sans re-compter un nouvel appel.
    const outcomeStatuses = ['VALIDEE', 'ANNULEE', 'INJOIGNABLE'];
    const updateData = {};

    if (oldStatus !== newStatus) {
      // Décrémenter l'ancien résultat si besoin (correction)
      if (oldStatus === 'VALIDEE') updateData.totalValides = { increment: -1 };
      if (oldStatus === 'ANNULEE') updateData.totalAnnules = { increment: -1 };
      if (oldStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: -1 };

      // Incrémenter le nouveau résultat si besoin
      if (newStatus === 'VALIDEE') updateData.totalValides = { increment: (updateData.totalValides?.increment || 0) + 1 };
      if (newStatus === 'ANNULEE') updateData.totalAnnules = { increment: (updateData.totalAnnules?.increment || 0) + 1 };
      if (newStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: (updateData.totalInjoignables?.increment || 0) + 1 };

      // Comptabiliser un appel uniquement quand on passe d'un statut non-résultat à un résultat
      if (!outcomeStatuses.includes(oldStatus) && outcomeStatuses.includes(newStatus)) {
        updateData.totalAppels = { increment: 1 };
      }
    }

    if (stat) {
      // Éviter update vide
      if (Object.keys(updateData).length > 0) {
        await prisma.callStatistic.update({
          where: { id: stat.id },
          data: updateData
        });
      }
    } else {
      const isOutcome = ['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(newStatus);
      await prisma.callStatistic.create({
        data: {
          userId,
          date: todayStart,
          totalAppels: isOutcome ? 1 : 0,
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
        date: { gte: todayStart, lt: tomorrowStart }
      },
      orderBy: { date: 'desc' }
    });

    // Ajustements symétriques en cas de correction (ex: LIVREE -> REFUSEE)
    const updateData = {};

    if (oldStatus !== newStatus) {
      // Décrémenter l'ancien statut si besoin
      if (oldStatus === 'LIVREE') {
        updateData.totalLivraisons = { increment: -1 };
        updateData.montantLivre = { increment: -montant };
      }
      if (oldStatus === 'REFUSEE') updateData.totalRefusees = { increment: -1 };
      if (oldStatus === 'ANNULEE_LIVRAISON') updateData.totalAnnulees = { increment: -1 };

      // Incrémenter le nouveau statut si besoin
      if (newStatus === 'LIVREE') {
        updateData.totalLivraisons = { increment: (updateData.totalLivraisons?.increment || 0) + 1 };
        updateData.montantLivre = { increment: (updateData.montantLivre?.increment || 0) + montant };
      }
      if (newStatus === 'REFUSEE') {
        updateData.totalRefusees = { increment: (updateData.totalRefusees?.increment || 0) + 1 };
      }
      if (newStatus === 'ANNULEE_LIVRAISON') {
        updateData.totalAnnulees = { increment: (updateData.totalAnnulees?.increment || 0) + 1 };
      }
    }

    if (stat) {
      if (Object.keys(updateData).length > 0) {
        await prisma.deliveryStatistic.update({
          where: { id: stat.id },
          data: updateData
        });
      }
    } else {
      await prisma.deliveryStatistic.create({
        data: {
          userId,
          date: todayStart,
          totalLivraisons: newStatus === 'LIVREE' ? 1 : 0,
          totalRefusees: newStatus === 'REFUSEE' ? 1 : 0,
          totalAnnulees: newStatus === 'ANNULEE_LIVRAISON' ? 1 : 0,
          montantLivre: newStatus === 'LIVREE' ? montant : 0
        }
      });
    }
  }
}

// POST /api/orders/:id/renvoyer-appel - Renvoyer une commande vers "À appeler"
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.post('/:id/renvoyer-appel', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Empêcher de renvoyer des commandes déjà livrées ou en cours de livraison
    if (['LIVREE', 'ASSIGNEE', 'EXPEDITION', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Impossible de renvoyer une commande en cours de livraison ou déjà livrée.' 
      });
    }

    // Réinitialiser la commande au statut A_APPELER
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'A_APPELER',
        callerId: null, // Retirer l'appelant assigné
        calledAt: null,
        validatedAt: null,
        noteAppelant: motif ? `[RENVOYÉE] ${motif}` : order.noteAppelant,
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } },
        deliverer: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'A_APPELER',
        changedBy: req.user.id,
        comment: `Commande renvoyée vers "À appeler" par ${req.user.prenom} ${req.user.nom}${motif ? ' - Motif: ' + motif : ''}`
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande renvoyée vers "À appeler" avec succès.' 
    });
  } catch (error) {
    console.error('Erreur renvoi commande:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de la commande.' });
  }
});

// POST /api/orders/:id/attente-paiement - Marquer une commande en attente de paiement
// Accessible par APPELANT, ADMIN et GESTIONNAIRE
router.post('/:id/attente-paiement', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande n'est pas déjà traitée
    if (!['A_APPELER', 'NOUVELLE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cette commande a déjà été traitée.' 
      });
    }

    // Marquer en attente de paiement
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        enAttentePaiement: true,
        attentePaiementAt: new Date(),
        callerId: req.user.id, // Assigner l'appelant
        calledAt: new Date(),
        noteAppelant: note ? `[EN ATTENTE PAIEMENT] ${note}` : '[EN ATTENTE PAIEMENT] Client prêt à payer',
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status, // Le statut ne change pas
        changedBy: req.user.id,
        comment: `Marquée "En attente de paiement" par ${req.user.prenom} ${req.user.nom}${note ? ' - Note: ' + note : ''}`
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande marquée en attente de paiement.' 
    });
  } catch (error) {
    console.error('Erreur attente paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise en attente de paiement.' });
  }
});

// PUT /api/orders/:id/quantite - Modifier la quantité d'une commande (NOUVELLE, A_APPELER, VALIDEE)
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/quantite', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('quantite').isInt({ min: 1 }).withMessage('La quantité doit être au minimum 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantite } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { product: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est NOUVELLE, A_APPELER ou VALIDEE
    if (!['NOUVELLE', 'A_APPELER', 'VALIDEE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Seules les commandes NOUVELLE, A_APPELER ou VALIDEES peuvent être modifiées.' 
      });
    }

    // Calculer le nouveau montant:
    // - Si le produit est lié -> utiliser le produit complet (avec prix par paliers)
    // - Sinon -> fallback sur l'ancien calcul (proportionnel)
    let nouveauMontant;
    if (order.product) {
      // Passer le produit complet pour prendre en compte prix2Unites et prix3Unites
      nouveauMontant = computeTotalAmount(order.product, quantite);
    } else {
      // Fallback : calcul proportionnel si pas de produit lié
      const prixUnitaire = order.quantite ? Number(order.montant) / Number(order.quantite) : Number(order.montant);
      nouveauMontant = computeTotalAmount(prixUnitaire, quantite);
    }

    // Pas de vérification de stock - on autorise les modifications même avec stock insuffisant
    // Le stock sera renouvelé plus tard

    // Transaction pour mettre à jour la commande et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Ajuster le stock si nécessaire
      if (order.product && order.status === 'VALIDEE') {
        const differenceQuantite = quantite - order.quantite;
        
        if (order.deliveryType === 'EXPEDITION') {
          // Pour EXPEDITION, le stock a déjà été réduit lors de la création
          // Récupérer le stock actuel avant modification
          const stockAvant = order.product.stockActuel;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          // Ajuster selon la différence
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockActuel: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION' : 'RETOUR',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        } else if (order.deliveryType === 'EXPRESS') {
          // Pour EXPRESS, ajuster le stockExpress
          const stockAvant = order.product.stockExpress;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockExpress: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION_EXPRESS' : 'ANNULATION_EXPRESS',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        }
      }

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          quantite: quantite,
          montant: nouveauMontant,
          montantRestant: order.montantRestant 
            ? (nouveauMontant - (order.montantPaye || 0)) 
            : null,
        },
        include: {
          product: true,
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        }
      });

      // Enregistrer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Quantité modifiée: ${order.quantite} → ${quantite} | Montant: ${order.montant} FCFA → ${nouveauMontant} FCFA`
        }
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: `Quantité modifiée avec succès: ${order.quantite} → ${quantite}` 
    });
  } catch (error) {
    console.error('Erreur modification quantité:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la quantité.' });
  }
});

// PUT /api/orders/:id/adresse - Modifier l'adresse de livraison d'une commande VALIDEE
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/adresse', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientVille').notEmpty().withMessage('La ville est requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { clientVille, clientCommune, clientAdresse } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est VALIDEE (pas encore assignée)
    if (order.status !== 'VALIDEE') {
      return res.status(400).json({ 
        error: 'Seules les commandes VALIDEES (non assignées) peuvent avoir leur adresse modifiée.' 
      });
    }

    // Mettre à jour l'adresse
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          clientVille,
          clientCommune: clientCommune || order.clientCommune,
          clientAdresse: clientAdresse || order.clientAdresse,
        }
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Adresse modifiée: ${order.clientVille} → ${clientVille}${clientCommune ? ' | ' + clientCommune : ''}${clientAdresse ? ' | ' + clientAdresse : ''}`
        }
      });

      return updated;
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Adresse de livraison modifiée avec succès.' 
    });
  } catch (error) {
    console.error('Erreur modification adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'adresse.' });
  }
});

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

// POST /api/orders/:id/expedition - Créer une EXPÉDITION (paiement 100%)
router.post('/:id/expedition', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, note } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande a un produit lié
    if (!order.productId) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de produit associé.' });
    }

    if (!order.product) {
      return res.status(400).json({ error: 'Produit non trouvé pour cette commande.' });
    }

    if (parseFloat(montantPaye) < order.montant) {
      return res.status(400).json({ 
        error: 'Le montant payé doit être égal au montant total pour une EXPÉDITION.' 
      });
    }

    // Transaction pour mettre à jour la commande ET réduire le stock immédiatement
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le stock actuel dans la transaction pour éviter les problèmes de concurrence
      const product = await tx.product.findUnique({
        where: { id: order.productId }
      });

      if (!product) {
        throw new Error('Produit introuvable');
      }

      // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPEDITION
      // Le stock sera renouvelé plus tard

      // Réduire le stock immédiatement (peut devenir négatif)
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant - order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockActuel: stockApres },
      });

      // Créer un mouvement de stock
      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'RESERVATION',
          quantite: -order.quantite,
          stockAvant,
          stockApres,
          orderId: order.id,
          effectuePar: req.user.id,
          motif: `Réservation stock pour EXPÉDITION ${order.orderReference} - ${order.clientNom}`
        }
      });

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPEDITION',
          deliveryType: 'EXPEDITION',
          montantPaye: parseFloat(montantPaye),
          montantRestant: 0,
          modePaiement,
          referencePayment,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement EXPEDITION pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
        },
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: 'EXPEDITION',
          changedBy: req.user.id,
          comment: `EXPÉDITION - Paiement total: ${montantPaye} FCFA via ${modePaiement}${referencePayment ? ' - Réf: ' + referencePayment : ''} | Stock réduit: ${order.quantite}`,
        },
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: 'Commande transférée en EXPÉDITION avec succès. Stock réduit immédiatement.' 
    });
  } catch (error) {
    console.error('Erreur création EXPÉDITION:', error);
    // Si l'erreur vient de la transaction (throw new Error), renvoyer le message
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'expédition.' });
  }
});

// POST /api/orders/:id/express - Créer un EXPRESS (paiement 10%)
router.post('/:id/express', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
  body('agenceRetrait').notEmpty().withMessage('Agence de retrait requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, agenceRetrait, note } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    const dixPourcent = order.montant * 0.10;
    const montantRestant = order.montant - parseFloat(montantPaye);

    if (parseFloat(montantPaye) < dixPourcent * 0.8) {
      return res.status(400).json({ 
        error: `Le montant payé doit être au moins 10% du total (${Math.round(dixPourcent)} FCFA).` 
      });
    }

    // Transaction pour gérer le stock EXPRESS
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS',
          deliveryType: 'EXPRESS',
          montantPaye: parseFloat(montantPaye),
          montantRestant,
          modePaiement,
          referencePayment,
          agenceRetrait,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement avance EXPRESS (10%) pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
        },
      });

      // Déplacer le stock vers stock EXPRESS (réservé)
      if (order.productId && order.product) {
        const product = order.product;
        const stockNormalAvant = product.stockActuel;
        const stockExpressAvant = product.stockExpress || 0;
        const stockNormalApres = stockNormalAvant - order.quantite;
        const stockExpressApres = stockExpressAvant + order.quantite;

        // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPRESS
        await tx.product.update({
          where: { id: order.productId },
          data: { 
            stockActuel: stockNormalApres,
            stockExpress: stockExpressApres,
          },
        });

        // Créer mouvement de réservation EXPRESS
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RESERVATION_EXPRESS',
            quantite: order.quantite,
            stockAvant: stockNormalAvant,
            stockApres: stockNormalApres,
            effectuePar: req.user.id,
            motif: `Réservation EXPRESS - ${order.orderReference} - Acompte payé, en attente retrait agence ${agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS',
        changedBy: req.user.id,
        comment: `EXPRESS - Acompte: ${montantPaye} FCFA via ${modePaiement} | Restant: ${Math.round(montantRestant)} FCFA | Agence: ${agenceRetrait}${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande transférée en EXPRESS avec succès. Stock réservé.' 
    });
  } catch (error) {
    console.error('Erreur création EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'express.' });
  }
});

// PUT /api/orders/:id/express/arrive - Marquer un EXPRESS comme arrivé en agence
router.put('/:id/express/arrive', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (!['EXPRESS', 'EXPRESS_ENVOYE'].includes(order.status)) {
      return res.status(400).json({ error: 'Cette commande n\'est pas un EXPRESS en attente d\'arrivée.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS_ARRIVE',
        arriveAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Colis arrivé en agence: ${order.agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Colis marqué comme arrivé en agence.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/orders/:id/express/assign - Assigner un livreur à un EXPRESS (envoi vers agence)
router.post('/:id/express/assign', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('delivererId').isInt().withMessage('Livreur invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delivererId } = req.body;
    const orderId = parseInt(id);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée.' });

    if (order.deliveryType !== 'EXPRESS' || order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Seules les commandes EXPRESS (statut EXPRESS) peuvent être assignées.' });
    }

    const deliverer = await prisma.user.findUnique({ where: { id: parseInt(delivererId) } });
    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        delivererId: parseInt(delivererId),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: orderId,
        oldStatus: order.status,
        newStatus: order.status, // pas de changement de statut
        changedBy: req.user.id,
        comment: `EXPRESS assigné au livreur ${deliverer.prenom} ${deliverer.nom} pour envoi à l'agence ${order.agenceRetrait || ''}`.trim(),
      },
    });

    res.json({
      order: updatedOrder,
      message: 'Livreur assigné à l’EXPRESS avec succès.',
    });
  } catch (error) {
    console.error('Erreur assignation EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de l’assignation de l’EXPRESS.' });
  }
});

// POST /api/orders/:id/express/expedier - Livreur confirme l'envoi du colis vers l'agence
router.post('/:id/express/expedier', authorize('LIVREUR', 'ADMIN'), [
  body('codeExpress').notEmpty().withMessage('Le code / référence d’envoi est obligatoire'),
  body('note').optional({ nullable: true }).isString().withMessage('Note invalide'),
  body('photoRecuExpress').optional({ nullable: true }).isString().withMessage('Photo invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { codeExpress, note, photoRecuExpress } = req.body;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée.' });

    if (order.deliveryType !== 'EXPRESS' || order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Cette commande n’est pas un EXPRESS en attente d’envoi.' });
    }

    if (req.user.role === 'LIVREUR') {
      if (!order.delivererId || order.delivererId !== req.user.id) {
        return res.status(403).json({ error: 'Cet EXPRESS ne vous est pas assigné.' });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS_ENVOYE',
        expressEnvoyeAt: new Date(),
        expressEnvoyePar: req.user.id,
        codeExpress: String(codeExpress).trim(),
        noteLivreur: note ? String(note).trim() : order.noteLivreur,
        photoRecuExpress: photoRecuExpress ? String(photoRecuExpress).trim() : null,
        photoRecuExpressUploadedAt: photoRecuExpress ? new Date() : null,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS_ENVOYE',
        changedBy: req.user.id,
        comment: `EXPRESS envoyé vers agence ${order.agenceRetrait || ''} | Code: ${String(codeExpress).trim()}`.trim(),
      },
    });

    res.json({
      order: updatedOrder,
      message: 'EXPRESS marqué comme envoyé vers l’agence.',
    });
  } catch (error) {
    console.error('Erreur expédier EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation d’envoi EXPRESS.' });
  }
});

// POST /api/orders/:id/express/notifier - Notifier le client (EXPRESS arrivé)
router.post('/:id/express/notifier', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        clientNotifie: true,
        notifieAt: new Date(),
        notifiePar: req.user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Client ${order.clientNom} notifié de l'arrivée du colis à l'agence ${order.agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Client notifié avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la notification.' });
  }
});

// POST /api/orders/:id/expedition/livrer - Livreur confirme livraison EXPÉDITION
router.post('/:id/expedition/livrer', authorize('LIVREUR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { codeExpedition, note, photoRecuExpedition } = req.body;

    // Validation : Code d'expédition obligatoire
    if (!codeExpedition || !codeExpedition.trim()) {
      return res.status(400).json({ error: 'Le code d\'expédition est obligatoire.' });
    }

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPEDITION' && order.status !== 'ASSIGNEE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas une EXPÉDITION ou n\'est pas assignée.' });
    }
    
    // Vérifier que le livreur est bien assigné à cette commande
    if (req.user.role === 'LIVREUR' && order.delivererId !== req.user.id) {
      return res.status(403).json({ error: 'Cette expédition ne vous est pas assignée.' });
    }

    // Mettre à jour la commande (PAS de réduction de stock car déjà réduit lors de la création EXPÉDITION)
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'LIVREE',
        deliveredAt: new Date(),
        delivererId: req.user.id || order.delivererId,
        noteLivreur: note || order.noteLivreur,
        codeExpedition: codeExpedition.trim(),
        photoRecuExpedition: photoRecuExpedition ? photoRecuExpedition.trim() : null, // ✅ Photo facultative
        photoRecuExpeditionUploadedAt: photoRecuExpedition ? new Date() : null, // ✅ Date si photo présente
        expedieAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'LIVREE',
        changedBy: req.user.id,
        comment: `EXPÉDITION confirmée comme livrée/expédiée par ${req.user.prenom} ${req.user.nom}${note ? ' - ' + note : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPÉDITION confirmée comme expédiée/livrée.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de livraison.' });
  }
});

// POST /api/orders/:id/express/finaliser - Finaliser EXPRESS (paiement des 90% restants)
router.post('/:id/express/finaliser', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const montantTotal = (order.montantPaye || 0) + parseFloat(montantPaye);
    
    if (montantTotal < order.montant * 0.95) {
      return res.status(400).json({ 
        error: `Le montant total payé (${Math.round(montantTotal)} FCFA) est insuffisant. Attendu: ${Math.round(order.montant)} FCFA.` 
      });
    }

    // Transaction pour gérer le stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS_LIVRE',
          montantPaye: montantTotal,
          montantRestant: 0,
          deliveredAt: new Date(),
        },
      });

      // Réduire le stock EXPRESS (pas le stock normal, déjà déplacé lors de la création)
      if (order.productId && order.product) {
        const product = order.product;
        const stockExpressAvant = product.stockExpress || 0;
        const stockExpressApres = stockExpressAvant - order.quantite;

        await tx.product.update({
          where: { id: order.productId },
          data: { stockExpress: stockExpressApres },
        });

        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RETRAIT_EXPRESS',
            quantite: -order.quantite,
            stockAvant: stockExpressAvant,
            stockApres: stockExpressApres,
            effectuePar: req.user.id,
            motif: `EXPRESS retiré par client - ${order.orderReference} - Agence: ${order.agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_LIVRE',
        changedBy: req.user.id,
        comment: `Paiement final: ${montantPaye} FCFA via ${modePaiement} | Total payé: ${Math.round(montantTotal)} FCFA${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPRESS finalisé avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la finalisation.' });
  }
});

// POST /api/orders/:id/expedition/assign - Assigner un livreur à une EXPÉDITION
router.post('/:id/expedition/assign', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('delivererId').isInt().withMessage('Livreur invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delivererId } = req.body;
    const orderId = parseInt(id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }
    if (order.status !== 'EXPEDITION') {
      return res.status(400).json({ error: 'Seules les commandes EXPÉDITION peuvent être assignées.' });
    }

    // Vérifier que le livreur existe
    const deliverer = await prisma.user.findUnique({
      where: { id: parseInt(delivererId) }
    });

    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    // Créer une DeliveryList pour l'EXPÉDITION (comme pour les livraisons locales)
    const deliveryDate = new Date();
    const deliveryList = await prisma.deliveryList.create({
      data: {
        nom: `EXPÉDITION ${order.orderReference} - ${order.clientVille}`,
        date: deliveryDate,
        delivererId: parseInt(delivererId),
        zone: order.clientVille
      }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        delivererId: parseInt(delivererId),
        deliveryListId: deliveryList.id,
        deliveryDate: deliveryDate,
        status: 'ASSIGNEE', // Passe en ASSIGNEE une fois assignée
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'ASSIGNEE',
        changedBy: req.user.id,
        comment: `EXPÉDITION assignée au livreur ${deliverer.prenom} ${deliverer.nom}.`
      }
    });

    res.json({ 
      order: updatedOrder,
      deliveryList,
      message: 'EXPÉDITION assignée au livreur avec succès. Le gestionnaire de stock doit confirmer la remise du colis.' 
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation du livreur:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'assignation du livreur.' });
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
      // Restaurer le stock si nécessaire selon le type et statut
      if (order.productId && order.product) {
        let needsStockRestoration = false;
        let stockField = 'stockActuel';

        // EXPÉDITION : stock réduit dès la création, restaurer si pas encore livrée
        if (order.deliveryType === 'EXPEDITION' && ['EXPEDITION', 'ASSIGNEE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockActuel';
        }
        
        // EXPRESS : stock EXPRESS réduit, restaurer si statuts EXPRESS ou EXPRESS_ARRIVE
        else if (order.deliveryType === 'EXPRESS' && ['EXPRESS', 'EXPRESS_ARRIVE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockExpress';
        }

        // Commandes livrées : stock déjà réduit, restaurer
        else if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
          needsStockRestoration = true;
          stockField = order.deliveryType === 'EXPRESS' ? 'stockExpress' : 'stockActuel';
        }

        if (needsStockRestoration) {
          const currentStock = order.product[stockField];
          const newStock = currentStock + order.quantite;

          // Restaurer le stock
          await tx.product.update({
            where: { id: order.productId },
            data: { [stockField]: newStock }
          });

          // Créer un mouvement de stock pour la restauration
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'CORRECTION',
              quantite: order.quantite,
              stockAvant: currentStock,
              stockApres: newStock,
              effectuePar: req.user.id,
              motif: `Restauration ${stockField} suite à suppression de la commande ${order.orderReference} (${order.deliveryType || 'LOCALE'})`
            }
          });
        }
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

// POST /api/orders/bulk-delete - Supprimer plusieurs commandes à la fois (Admin uniquement)
router.post('/bulk-delete', authorize('ADMIN'), [
  body('orderIds').isArray({ min: 1 }).withMessage('La liste des IDs est requise'),
  body('orderIds.*').isInt().withMessage('Chaque ID doit être un nombre')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderIds } = req.body;
    const numericIds = orderIds.map(id => parseInt(id));

    // Récupérer toutes les commandes à supprimer avec leurs informations de produit
    const orders = await prisma.order.findMany({
      where: { id: { in: numericIds } },
      include: { product: true }
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Aucune commande trouvée.' });
    }

    // Transaction pour gérer toutes les suppressions
    const result = await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      let restoredStock = {};

      for (const order of orders) {
        // Restaurer le stock si nécessaire selon le type et statut
        if (order.productId && order.product) {
          let needsStockRestoration = false;
          let stockField = 'stockActuel';

          // EXPÉDITION : stock réduit dès la création, restaurer si pas encore livrée
          if (order.deliveryType === 'EXPEDITION' && ['EXPEDITION', 'ASSIGNEE'].includes(order.status)) {
            needsStockRestoration = true;
            stockField = 'stockActuel';
          }
          
          // EXPRESS : stock EXPRESS réduit, restaurer si statuts EXPRESS ou EXPRESS_ARRIVE
          else if (order.deliveryType === 'EXPRESS' && ['EXPRESS', 'EXPRESS_ARRIVE'].includes(order.status)) {
            needsStockRestoration = true;
            stockField = 'stockExpress';
          }

          // Commandes livrées : stock déjà réduit, restaurer
          else if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
            needsStockRestoration = true;
            stockField = order.deliveryType === 'EXPRESS' ? 'stockExpress' : 'stockActuel';
          }

          if (needsStockRestoration) {
            const currentStock = order.product[stockField];
            const newStock = currentStock + order.quantite;

            // Restaurer le stock
            await tx.product.update({
              where: { id: order.productId },
              data: { [stockField]: newStock }
            });

            // Créer un mouvement de stock pour la restauration
            await tx.stockMovement.create({
              data: {
                productId: order.productId,
                type: 'CORRECTION',
                quantite: order.quantite,
                stockAvant: currentStock,
                stockApres: newStock,
                effectuePar: req.user.id,
                motif: `Restauration ${stockField} suite à suppression multiple de la commande ${order.orderReference} (${order.deliveryType || 'LOCALE'})`
              }
            });

            // Tracker les restaurations de stock pour le résumé
            if (!restoredStock[order.productId]) {
              restoredStock[order.productId] = {
                nom: order.product.nom,
                quantite: 0
              };
            }
            restoredStock[order.productId].quantite += order.quantite;
          }
        }

        // Supprimer les mouvements de stock liés à cette commande
        await tx.stockMovement.deleteMany({
          where: { orderId: order.id }
        });

        // Supprimer l'historique des statuts
        await tx.statusHistory.deleteMany({
          where: { orderId: order.id }
        });

        deletedCount++;
      }

      // Supprimer toutes les commandes en une seule requête
      await tx.order.deleteMany({
        where: { id: { in: numericIds } }
      });

      return { deletedCount, restoredStock };
    });

    res.json({ 
      message: `${result.deletedCount} commande(s) supprimée(s) avec succès.`,
      deletedCount: result.deletedCount,
      restoredStock: result.restoredStock
    });
  } catch (error) {
    console.error('Erreur suppression multiple commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des commandes.' });
  }
});

// PUT /api/orders/:id/note-appelant - Modifier la note appelant d'une commande
// Accessible uniquement par ADMIN et GESTIONNAIRE (gestionnaire principal)
router.put('/:id/note-appelant', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('noteAppelant')
    .optional({ nullable: true })
    .isString()
    .withMessage('La note appelant doit être une chaîne de caractères'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { noteAppelant } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    const normalizedNote =
      typeof noteAppelant === 'string'
        ? (noteAppelant.trim() === '' ? null : noteAppelant.trim())
        : null;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: { noteAppelant: normalizedNote },
        include: {
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        }
      });

      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Note appelant modifiée par ${req.user.prenom} ${req.user.nom}`
        }
      });

      return updated;
    });

    res.json({
      order: updatedOrder,
      message: 'Note appelant modifiée avec succès.'
    });
  } catch (error) {
    console.error('Erreur modification note appelant:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la note appelant.' });
  }
});

export default router;

