import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/accounting/stats - Statistiques comptables détaillées
// Accessible uniquement par ADMIN
router.get('/stats', authorize('ADMIN'), async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;

    // Définir les dates par défaut (aujourd'hui)
    const startDate = dateDebut ? new Date(dateDebut) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateFin ? new Date(dateFin) : new Date(new Date().setHours(23, 59, 59, 999));

    // Récupérer toutes les commandes livrées dans la période
    const commandes = await prisma.order.findMany({
      where: {
        OR: [
          {
            status: 'LIVREE',
            deliveredAt: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            status: 'EXPEDITION',
            expedieAt: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            status: 'ARRIVEE',
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
        deliveredAt: 'desc'
      }
    });

    // 1. LIVRAISONS LOCALES (LIVREE + deliveryType = LOCAL)
    const livraisonsLocales = commandes.filter(
      c => c.status === 'LIVREE' && c.deliveryType === 'LOCAL'
    );
    const totalLivraisonsLocales = livraisonsLocales.reduce((sum, c) => sum + c.montant, 0);
    const nombreLivraisonsLocales = livraisonsLocales.length;

    // 2. EXPEDITIONS (paiement 100% avant envoi)
    const expeditions = commandes.filter(
      c => (c.status === 'EXPEDITION' || c.status === 'ARRIVEE') && c.deliveryType === 'EXPEDITION'
    );
    const totalExpeditions = expeditions.reduce((sum, c) => sum + c.montant, 0);
    const nombreExpeditions = expeditions.length;

    // 3. EXPRESS - Paiement en avance (10%)
    const expressAvance = commandes.filter(
      c => c.deliveryType === 'EXPRESS' && c.expedieAt && !c.arriveAt
    );
    const totalExpressAvance = expressAvance.reduce((sum, c) => sum + (c.montant * 0.10), 0);
    const nombreExpressAvance = expressAvance.length;

    // 4. EXPRESS - Retrait en agence (90% restant)
    const expressRetrait = commandes.filter(
      c => c.status === 'ARRIVEE' && c.deliveryType === 'EXPRESS'
    );
    const totalExpressRetrait = expressRetrait.reduce((sum, c) => sum + (c.montant * 0.90), 0);
    const nombreExpressRetrait = expressRetrait.length;

    // Total général
    const totalGeneral = totalLivraisonsLocales + totalExpeditions + totalExpressAvance + totalExpressRetrait;

    // Données pour graphiques - Évolution journalière
    const evolutionJournaliere = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const jourDebut = new Date(currentDate);
      jourDebut.setHours(0, 0, 0, 0);
      const jourFin = new Date(currentDate);
      jourFin.setHours(23, 59, 59, 999);

      const commandesJour = commandes.filter(c => {
        const date = c.deliveredAt || c.expedieAt || c.arriveAt;
        return date >= jourDebut && date <= jourFin;
      });

      const local = commandesJour
        .filter(c => c.status === 'LIVREE' && c.deliveryType === 'LOCAL')
        .reduce((sum, c) => sum + c.montant, 0);

      const expedition = commandesJour
        .filter(c => c.deliveryType === 'EXPEDITION')
        .reduce((sum, c) => sum + c.montant, 0);

      const expressAvanceJour = commandesJour
        .filter(c => c.deliveryType === 'EXPRESS' && c.expedieAt && !c.arriveAt)
        .reduce((sum, c) => sum + (c.montant * 0.10), 0);

      const expressRetraitJour = commandesJour
        .filter(c => c.status === 'ARRIVEE' && c.deliveryType === 'EXPRESS')
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
    const livreurStats = {};
    commandes.forEach(c => {
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
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 5);

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

