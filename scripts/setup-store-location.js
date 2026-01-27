import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupStoreLocation() {
  console.log('🚀 Configuration du magasin pour le système de géolocalisation...\n');

  // ⚠️ IMPORTANT : REMPLACEZ PAR VOS COORDONNÉES GPS RÉELLES
  // Comment obtenir vos coordonnées :
  // 1. Ouvrir Google Maps
  // 2. Cliquer-droit sur votre magasin
  // 3. Cliquer sur les coordonnées qui apparaissent
  // 4. Copier (format: 5.353021, -3.870182)
  
  const latitude = 5.353021;   // ⚠️ À REMPLACER - Latitude de votre magasin
  const longitude = -3.870182;  // ⚠️ À REMPLACER - Longitude de votre magasin

  try {
    const storeConfig = await prisma.storeConfig.upsert({
      where: { id: 1 },
      update: {
        nom: 'Magasin Principal',
        adresse: 'Abidjan, Côte d\'Ivoire', // ⚠️ À PERSONNALISER
        latitude: latitude,
        longitude: longitude,
        rayonTolerance: 50,          // 50 mètres (ajustez si nécessaire)
        heureOuverture: '08:00',     // Heure d'ouverture
        heureFermeture: '18:00',     // Heure de fermeture
        toleranceRetard: 15,         // 15 minutes de tolérance pour le retard
      },
      create: {
        nom: 'Magasin Principal',
        adresse: 'Abidjan, Côte d\'Ivoire', // ⚠️ À PERSONNALISER
        latitude: latitude,
        longitude: longitude,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
      },
    });

    console.log('✅ Configuration réussie!\n');
    console.log('📍 Détails de la configuration :');
    console.log('   ═══════════════════════════════════════');
    console.log(`   📌 Nom        : ${storeConfig.nom}`);
    console.log(`   📍 Adresse    : ${storeConfig.adresse || 'Non renseignée'}`);
    console.log(`   🌍 Latitude   : ${storeConfig.latitude}`);
    console.log(`   🌍 Longitude  : ${storeConfig.longitude}`);
    console.log(`   📏 Rayon      : ${storeConfig.rayonTolerance}m`);
    console.log(`   🕐 Ouverture  : ${storeConfig.heureOuverture}`);
    console.log(`   🕐 Fermeture  : ${storeConfig.heureFermeture}`);
    console.log(`   ⏱️  Tolérance : ${storeConfig.toleranceRetard} min`);
    console.log('   ═══════════════════════════════════════\n');

    console.log('🎉 Le système de pointage GPS est maintenant configuré !');
    console.log('📱 Les employés peuvent pointer leur présence depuis l\'application.\n');
    console.log('💡 Conseils :');
    console.log('   - Si trop de pointages sont refusés, augmentez le rayon (50m → 100m)');
    console.log('   - Testez d\'abord avec un employé avant déploiement complet');
    console.log('   - Vérifiez que les coordonnées GPS correspondent bien à votre magasin');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifiez que la migration a bien été appliquée (npx prisma migrate deploy)');
    console.error('   2. Vérifiez votre connexion à la base de données');
    console.error('   3. Vérifiez que les coordonnées GPS sont des nombres valides');
  } finally {
    await prisma.$disconnect();
  }
}

setupStoreLocation();
