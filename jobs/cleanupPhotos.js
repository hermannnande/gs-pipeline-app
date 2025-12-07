import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Job de nettoyage automatique des photos d'expédition
 * Supprime les photos de plus de 7 jours pour économiser l'espace
 * S'exécute tous les jours à 2h du matin
 */
const cleanupExpiredPhotos = async () => {
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
      return;
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
    console.log('📋 [CLEANUP] Commandes concernées:', 
      ordersWithExpiredPhotos.map(o => o.orderReference).join(', ')
    );

  } catch (error) {
    console.error('❌ [CLEANUP] Erreur lors du nettoyage des photos:', error);
  }
};

/**
 * Planifier le job cron
 * Tous les jours à 2h00 du matin
 * Format: seconde minute heure jour mois jour-de-la-semaine
 */
const scheduleCleanupJob = () => {
  // Exécution quotidienne à 2h00 du matin
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON] Exécution planifiée du nettoyage des photos...');
    await cleanupExpiredPhotos();
  }, {
    timezone: "Africa/Abidjan" // Fuseau horaire de la Côte d'Ivoire
  });

  console.log('✅ [CRON] Job de nettoyage des photos planifié (tous les jours à 2h00).');
};

// Exporter les fonctions
export {
  cleanupExpiredPhotos,
  scheduleCleanupJob
};
