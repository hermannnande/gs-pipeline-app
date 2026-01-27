import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTwoLocations() {
  console.log('🚀 Configuration des DEUX bureaux pour le système de géolocalisation...\n');

  try {
    // Bureau 1 : Hôtel bar 444
    const bureau1 = await prisma.storeConfig.upsert({
      where: { id: 1 },
      update: {
        nom: 'Hôtel bar 444',
        adresse: 'Bingerville, Côte d\'Ivoire',
        latitude: 5.3534393,
        longitude: -3.8697718,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
        actif: true
      },
      create: {
        nom: 'Hôtel bar 444',
        adresse: 'Bingerville, Côte d\'Ivoire',
        latitude: 5.3534393,
        longitude: -3.8697718,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
        actif: true
      },
    });

    // Bureau 2 : Garage Orange
    const bureau2 = await prisma.storeConfig.upsert({
      where: { id: 2 },
      update: {
        nom: 'Garage Orange',
        adresse: 'Immeuble jaune, Bingerville, Côte d\'Ivoire',
        latitude: 5.3555878,
        longitude: -3.868019,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
        actif: true
      },
      create: {
        nom: 'Garage Orange',
        adresse: 'Immeuble jaune, Bingerville, Côte d\'Ivoire',
        latitude: 5.3555878,
        longitude: -3.868019,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
        actif: true
      },
    });

    console.log('✅ Configuration réussie!\n');
    console.log('📍 Détails des configurations :');
    console.log('   ═══════════════════════════════════════════════════════════════');
    console.log('\n   🏢 BUREAU 1 - Hôtel bar 444');
    console.log('   ─────────────────────────────────────');
    console.log(`   📌 Nom        : ${bureau1.nom}`);
    console.log(`   📍 Adresse    : ${bureau1.adresse || 'Non renseignée'}`);
    console.log(`   🌍 Latitude   : ${bureau1.latitude}`);
    console.log(`   🌍 Longitude  : ${bureau1.longitude}`);
    console.log(`   📏 Rayon      : ${bureau1.rayonTolerance}m`);
    console.log(`   🕐 Ouverture  : ${bureau1.heureOuverture}`);
    console.log(`   🕐 Fermeture  : ${bureau1.heureFermeture}`);
    console.log(`   ⏱️  Tolérance : ${bureau1.toleranceRetard} min`);
    console.log(`   ✅ Actif      : ${bureau1.actif ? 'Oui' : 'Non'}`);
    
    console.log('\n   🏢 BUREAU 2 - Garage Orange');
    console.log('   ─────────────────────────────────────');
    console.log(`   📌 Nom        : ${bureau2.nom}`);
    console.log(`   📍 Adresse    : ${bureau2.adresse || 'Non renseignée'}`);
    console.log(`   🌍 Latitude   : ${bureau2.latitude}`);
    console.log(`   🌍 Longitude  : ${bureau2.longitude}`);
    console.log(`   📏 Rayon      : ${bureau2.rayonTolerance}m`);
    console.log(`   🕐 Ouverture  : ${bureau2.heureOuverture}`);
    console.log(`   🕐 Fermeture  : ${bureau2.heureFermeture}`);
    console.log(`   ⏱️  Tolérance : ${bureau2.toleranceRetard} min`);
    console.log(`   ✅ Actif      : ${bureau2.actif ? 'Oui' : 'Non'}`);
    console.log('   ═══════════════════════════════════════════════════════════════\n');

    console.log('🎉 Le système de pointage GPS multi-sites est maintenant configuré !');
    console.log('📱 Les employés peuvent pointer leur présence depuis l\'un des DEUX bureaux.\n');
    console.log('💡 Comment ça marche :');
    console.log('   - Le système détecte automatiquement le bureau le plus proche');
    console.log('   - Si l\'employé est à moins de 50m de l\'un des bureaux → ✅ PRÉSENT');
    console.log('   - Sinon → ❌ ABSENT (avec indication du bureau le plus proche)');
    console.log('   - L\'employé voit dans quel bureau il a pointé\n');
    
    console.log('📊 Distance entre les deux bureaux :');
    const distanceBureaux = calculateDistance(
      bureau1.latitude,
      bureau1.longitude,
      bureau2.latitude,
      bureau2.longitude
    );
    console.log(`   📏 ${Math.round(distanceBureaux)}m entre Hôtel bar 444 et Garage Orange\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifiez que la migration a bien été appliquée (npx prisma migrate deploy)');
    console.error('   2. Vérifiez votre connexion à la base de données');
  } finally {
    await prisma.$disconnect();
  }
}

// Formule de Haversine pour calculer la distance entre deux points GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

setupTwoLocations();
