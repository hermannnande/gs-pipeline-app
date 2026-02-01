import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de test pour vérifier la configuration multi-magasins
 * Ce script affiche les magasins configurés et vérifie leur accessibilité
 */

async function testStoreConfig() {
  console.log('\n🧪 TEST DE CONFIGURATION - Pointage GPS Multi-Magasins\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Récupérer tous les magasins
    const stores = await prisma.storeConfig.findMany({
      orderBy: { id: 'asc' }
    });

    if (!stores || stores.length === 0) {
      console.log('❌ ÉCHEC : Aucun magasin configuré\n');
      console.log('💡 Solution : Exécutez le script de configuration :');
      console.log('   node scripts/setup-two-stores.js\n');
      return;
    }

    console.log(`✅ ${stores.length} magasin(s) trouvé(s) dans la base de données\n`);

    // Afficher chaque magasin
    stores.forEach((store, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏢 MAGASIN ${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 ID             : ${store.id}`);
      console.log(`📌 Nom            : ${store.nom}`);
      console.log(`📍 Adresse        : ${store.adresse || 'Non renseignée'}`);
      console.log(`🌍 Latitude       : ${store.latitude}`);
      console.log(`🌍 Longitude      : ${store.longitude}`);
      console.log(`📏 Rayon tolérance: ${store.rayonTolerance}m`);
      console.log(`🕐 Horaires       : ${store.heureOuverture} - ${store.heureFermeture}`);
      console.log(`⏱️  Tolérance retard: ${store.toleranceRetard} min`);
      console.log(`${store.actif ? '✅' : '❌'} Statut         : ${store.actif ? 'Actif' : 'Inactif'}`);
      console.log(`🗺️  Google Maps   : https://www.google.com/maps?q=${store.latitude},${store.longitude}`);
      console.log(``);
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Vérifier les magasins actifs
    const activeStores = stores.filter(s => s.actif);
    if (activeStores.length === 0) {
      console.log('⚠️  ATTENTION : Aucun magasin actif !\n');
      console.log('💡 Solution : Activez au moins un magasin dans la configuration\n');
      return;
    }

    console.log(`✅ ${activeStores.length} magasin(s) actif(s)\n`);

    // Statistiques des pointages (si existants)
    const attendanceCount = await prisma.attendance.count();
    console.log(`📊 STATISTIQUES`);
    console.log(`   Total pointages : ${attendanceCount}`);

    if (attendanceCount > 0) {
      // Pointages par magasin
      const attendancesByStore = await prisma.attendance.groupBy({
        by: ['storeLocationId'],
        _count: {
          id: true
        }
      });

      console.log(`\n   Répartition par magasin :`);
      for (const group of attendancesByStore) {
        const store = stores.find(s => s.id === group.storeLocationId);
        const storeName = store ? store.nom : `Magasin ${group.storeLocationId}`;
        console.log(`   - ${storeName} : ${group._count.id} pointage(s)`);
      }

      // Pointages sans magasin (avant multi-sites)
      const attendancesWithoutStore = await prisma.attendance.count({
        where: { storeLocationId: null }
      });
      if (attendancesWithoutStore > 0) {
        console.log(`   - Sans magasin (ancien) : ${attendancesWithoutStore} pointage(s)`);
      }
    }

    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 TEST RÉUSSI - Le système est prêt !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Prochaines étapes :');
    console.log('   1. Redémarrer le serveur : npm run dev');
    console.log('   2. Se connecter à l\'application');
    console.log('   3. Tester le pointage dans chaque magasin');
    console.log('   4. Vérifier que le système détecte bien le magasin le plus proche\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test :', error.message);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifiez que la base de données est accessible');
    console.error('   2. Vérifiez DATABASE_URL dans .env');
    console.error('   3. Exécutez : npx prisma generate');
    console.error('   4. Exécutez : npx prisma migrate deploy\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testStoreConfig();
