import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/accounting/stats - Statistiques comptables détaillées
// Accessible uniquement par ADMIN
router.get('/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;

    // Définir les dates par défaut (aujourd'hui en heure d'Abidjan - UTC+0)
    // Les dates viennent du frontend au format YYYY-MM-DD (ex: "2025-12-08")
    // Abidjan est en UTC+0, donc on utilise directement les dates UTC
    let startDate, endDate;
    
    if (dateDebut) {
      startDate = new Date(`${dateDebut}T00:00:00.000Z`);
    } else {
      // Aujourd'hui à minuit en UTC+0
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }
    
    if (dateFin) {
      endDate = new Date(`${dateFin}T23:59:59.999Z`);
    } else {
      // Aujourd'hui à 23:59:59 en UTC+0
      const now = new Date();
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    }

    // Récupérer toutes les commandes dans la période (tous types)
    const commandes = await prisma.order.findMany({
      where: {
        OR: [
          // Livraisons locales
          {
            deliveryType: 'LOCAL',
            status: 'LIVREE',
            deliveredAt: {
              gte: startDate,
              lte: endDate
            }
          },
          // Expéditions (paiement 100% avant envoi)
          {
            deliveryType: 'EXPEDITION',
            status: 'EXPEDITION',
            expedieAt: {
              gte: startDate,
              lte: endDate
            }
          },
          // Express - Envoyés (10% payé)
          {
            deliveryType: 'EXPRESS',
            status: 'EXPRESS',
            expedieAt: {
              gte: startDate,
              lte: endDate
            }
          },
          // Express - Arrivés en agence (90% à payer)
          {
            deliveryType: 'EXPRESS',
            status: { in: ['EXPRESS_ARRIVE', 'EXPRESS_LIVRE'] },
            arriveAt: {
              gte: startDate,
              lte: endDate
            }
          }
        ]
      },
      include: {
        product: { select: { nom: true } },
        deliverer: { select: { nom: true, prenom: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1. LIVRAISONS LOCALES (LIVREE + deliveryType = LOCAL)
    const livraisonsLocales = commandes.filter(
      c => c.deliveryType === 'LOCAL' && c.status === 'LIVREE'
    );
    const totalLivraisonsLocales = livraisonsLocales.reduce((sum, c) => sum + c.montant, 0);
    const nombreLivraisonsLocales = livraisonsLocales.length;

    // 2. EXPEDITIONS (paiement 100% avant envoi)
    const expeditions = commandes.filter(
      c => c.deliveryType === 'EXPEDITION' && c.status === 'EXPEDITION'
    );
    const totalExpeditions = expeditions.reduce((sum, c) => sum + c.montant, 0);
    const nombreExpeditions = expeditions.length;

    // 3. EXPRESS - Paiement en avance (10%)
    const expressAvance = commandes.filter(
      c => c.deliveryType === 'EXPRESS' && c.status === 'EXPRESS'
    );
    const totalExpressAvance = expressAvance.reduce((sum, c) => sum + (c.montant * 0.10), 0);
    const nombreExpressAvance = expressAvance.length;

    // 4. EXPRESS - Retrait en agence (90% restant)
    const expressRetrait = commandes.filter(
      c => c.deliveryType === 'EXPRESS' && (c.status === 'EXPRESS_ARRIVE' || c.status === 'EXPRESS_LIVRE')
    );
    const totalExpressRetrait = expressRetrait.reduce((sum, c) => sum + (c.montant * 0.90), 0);
    const nombreExpressRetrait = expressRetrait.length;

    // Total général
    const totalGeneral = totalLivraisonsLocales + totalExpeditions + totalExpressAvance + totalExpressRetrait;

    // Données pour graphiques - Évolution journalière (UTC+0 - Abidjan)
    const evolutionJournaliere = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Créer les bornes du jour en UTC (Abidjan = UTC+0)
      const jourDebut = new Date(Date.UTC(
        currentDate.getUTCFullYear(), 
        currentDate.getUTCMonth(), 
        currentDate.getUTCDate(), 
        0, 0, 0, 0
      ));
      const jourFin = new Date(Date.UTC(
        currentDate.getUTCFullYear(), 
        currentDate.getUTCMonth(), 
        currentDate.getUTCDate(), 
        23, 59, 59, 999
      ));

      const commandesJour = commandes.filter(c => {
        const date = c.deliveredAt || c.expedieAt || c.arriveAt;
        return date >= jourDebut && date <= jourFin;
      });

      const local = commandesJour
        .filter(c => c.deliveryType === 'LOCAL' && c.status === 'LIVREE')
        .reduce((sum, c) => sum + c.montant, 0);

      const expedition = commandesJour
        .filter(c => c.deliveryType === 'EXPEDITION' && c.status === 'EXPEDITION')
        .reduce((sum, c) => sum + c.montant, 0);

      const expressAvanceJour = commandesJour
        .filter(c => c.deliveryType === 'EXPRESS' && c.status === 'EXPRESS')
        .reduce((sum, c) => sum + (c.montant * 0.10), 0);

      const expressRetraitJour = commandesJour
        .filter(c => c.deliveryType === 'EXPRESS' && (c.status === 'EXPRESS_ARRIVE' || c.status === 'EXPRESS_LIVRE'))
        .reduce((sum, c) => sum + (c.montant * 0.90), 0);

      evolutionJournaliere.push({
        date: jourDebut.toISOString().split('T')[0],
        local,
        expedition,
        expressAvance: expressAvanceJour,
        expressRetrait: expressRetraitJour,
        total: local + expedition + expressAvanceJour + expressRetraitJour
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Top livreurs
    // ⚠️ Pour être exact, on se base uniquement sur les LIVRAISONS LOCALES (LOCAL + LIVREE).
    // Les EXPEDITIONS/EXPRESS ne reflètent pas un encaissement "livreur" (et l'encaissement est fractionné pour EXPRESS).
    const livreurStats = {};
    livraisonsLocales.forEach(c => {
      if (c.deliverer) {
        const key = `${c.deliverer.prenom} ${c.deliverer.nom}`;
        if (!livreurStats[key]) {
          livreurStats[key] = { nom: key, montant: 0, nombre: 0 };
        }
        livreurStats[key].montant += c.montant;
        livreurStats[key].nombre += 1;
      }
    });

    const topLivreurs = Object.values(livreurStats)
      .sort((a, b) => b.montant - a.montant); // Tous les livreurs, triés par montant décroissant

    res.json({
      periode: {
        debut: startDate.toISOString(),
        fin: endDate.toISOString()
      },
      resume: {
        livraisonsLocales: {
          montant: totalLivraisonsLocales,
          nombre: nombreLivraisonsLocales
        },
        expeditions: {
          montant: totalExpeditions,
          nombre: nombreExpeditions
        },
        expressAvance: {
          montant: totalExpressAvance,
          nombre: nombreExpressAvance
        },
        expressRetrait: {
          montant: totalExpressRetrait,
          nombre: nombreExpressRetrait
        },
        total: {
          montant: totalGeneral,
          nombre: commandes.length
        }
      },
      evolutionJournaliere,
      topLivreurs,
      details: {
        livraisonsLocales: livraisonsLocales.map(c => ({
          id: c.id,
          reference: c.orderReference,
          client: c.clientNom,
          produit: c.product.nom,
          montant: c.montant,
          date: c.deliveredAt,
          livreur: c.deliverer ? `${c.deliverer.prenom} ${c.deliverer.nom}` : 'N/A'
        })),
        expeditions: expeditions.map(c => ({
          id: c.id,
          reference: c.orderReference,
          client: c.clientNom,
          ville: c.clientVille,
          produit: c.product.nom,
          montant: c.montant,
          date: c.expedieAt || c.arriveAt,
          codeExpedition: c.codeExpedition
        })),
        expressAvance: expressAvance.map(c => ({
          id: c.id,
          reference: c.orderReference,
          client: c.clientNom,
          ville: c.clientVille,
          produit: c.product.nom,
          montantTotal: c.montant,
          avance: c.montant * 0.10,
          date: c.expedieAt
        })),
        expressRetrait: expressRetrait.map(c => ({
          id: c.id,
          reference: c.orderReference,
          client: c.clientNom,
          ville: c.clientVille,
          agence: c.agenceRetrait,
          produit: c.product.nom,
          montantTotal: c.montant,
          retrait: c.montant * 0.90,
          date: c.arriveAt
        }))
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats comptables:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

export default router;

