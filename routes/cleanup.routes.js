import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/cleanup/photos
 * Nettoyer les photos expirées (plus de 7 jours)
 * Accessible uniquement par ADMIN
 */
router.get('/photos', authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🧹 [CLEANUP] Démarrage du nettoyage des photos expirées...');
    
    // Calculer la date limite (7 jours en arrière)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Trouver toutes les commandes avec photos expirées
    const ordersWithExpiredPhotos = await prisma.order.findMany({
      where: {
        photoRecuExpedition: { not: null },
        photoRecuExpeditionUploadedAt: {
          lt: sevenDaysAgo
        }
      },
      select: {
        id: true,
        orderReference: true,
        photoRecuExpeditionUploadedAt: true
      }
    });

    if (ordersWithExpiredPhotos.length === 0) {
      console.log('✅ [CLEANUP] Aucune photo expirée à supprimer.');
      return res.json({ 
        message: 'Aucune photo expirée à supprimer', 
        count: 0 
      });
    }

    console.log(`📸 [CLEANUP] ${ordersWithExpiredPhotos.length} photo(s) expirée(s) trouvée(s).`);

    // Supprimer les photos expirées
    const result = await prisma.order.updateMany({
      where: {
        id: { in: ordersWithExpiredPhotos.map(o => o.id) }
      },
      data: {
        photoRecuExpedition: null,
        photoRecuExpeditionUploadedAt: null
      }
    });

    console.log(`✅ [CLEANUP] ${result.count} photo(s) supprimée(s) avec succès.`);
    
    const deletedReferences = ordersWithExpiredPhotos.map(o => o.orderReference);
    console.log('📋 [CLEANUP] Commandes concernées:', deletedReferences.join(', '));

    res.json({ 
      message: `${result.count} photo(s) expirée(s) supprimée(s) avec succès`, 
      count: result.count,
      orders: deletedReferences
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur lors du nettoyage des photos:', error);
    res.status(500).json({ error: 'Erreur lors du nettoyage des photos' });
  }
});

/**
 * GET /api/cleanup/photos/check
 * Vérifier combien de photos sont expirées sans les supprimer
 * Accessible par ADMIN
 */
router.get('/photos/check', authorize('ADMIN'), async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const count = await prisma.order.count({
      where: {
        photoRecuExpedition: { not: null },
        photoRecuExpeditionUploadedAt: {
          lt: sevenDaysAgo
        }
      }
    });

    res.json({ 
      message: `${count} photo(s) expirée(s) peuvent être supprimée(s)`, 
      count 
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

export default router;

