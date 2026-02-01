import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTwoStores() {
  console.log('🏢 Configuration de 2 magasins pour le système de pointage GPS...\n');

  // ⚠️ IMPORTANT : REMPLACEZ PAR VOS COORDONNÉES GPS RÉELLES
  // Comment obtenir vos coordonnées :
  // 1. Ouvrir Google Maps
  // 2. Cliquer-droit sur votre magasin
  // 3. Cliquer sur les coordonnées qui apparaissent
  // 4. Copier (format: 5.353021, -3.870182)

  // ═══════════════════════════════════════════════════════════
  // 📍 BUREAU SERGE - ✅ CONFIGURÉ
  // ═══════════════════════════════════════════════════════════
  const magasin1 = {
    nom: 'Bureau Serge',
    adresse: 'Abidjan, Côte d\'Ivoire',
    latitude: 5.353690327838379,        // ✅ Coordonnées exactes de Google Maps
    longitude: -3.8697717999999997,     // ✅ Coordonnées exactes de Google Maps
    rayonTolerance: 50,                 // 50 mètres (ajustez si nécessaire)
    heureOuverture: '08:00',            // Heure d'ouverture
    heureFermeture: '18:00',            // Heure de fermeture
    toleranceRetard: 15,                // 15 minutes de tolérance
    actif: true
  };

  // ═══════════════════════════════════════════════════════════
  // 📍 BUREAU MARTIAL - ✅ CONFIGURÉ
  // ═══════════════════════════════════════════════════════════
  const magasin2 = {
    nom: 'Bureau Martial',
    adresse: 'Abidjan, Côte d\'Ivoire',
    latitude: 5.356896858865524,        // ✅ Coordonnées exactes de Google Maps
    longitude: -3.8680458441418417,     // ✅ Coordonnées exactes de Google Maps
    rayonTolerance: 50,                 // 50 mètres
    heureOuverture: '08:00',
    heureFermeture: '18:00',
    toleranceRetard: 15,
    actif: true
  };

  try {
    // Créer ou mettre à jour Magasin 1
    const store1 = await prisma.storeConfig.upsert({
      where: { id: 1 },
      update: magasin1,
      create: { ...magasin1 },
    });

    console.log('✅ Magasin 1 configuré avec succès !');
    console.log('   ═══════════════════════════════════════');
    console.log(`   📌 Nom        : ${store1.nom}`);
    console.log(`   📍 Adresse    : ${store1.adresse || 'Non renseignée'}`);
    console.log(`   🌍 Latitude   : ${store1.latitude}`);
    console.log(`   🌍 Longitude  : ${store1.longitude}`);
    console.log(`   📏 Rayon      : ${store1.rayonTolerance}m`);
    console.log(`   🕐 Ouverture  : ${store1.heureOuverture}`);
    console.log(`   🕐 Fermeture  : ${store1.heureFermeture}`);
    console.log(`   ⏱️  Tolérance : ${store1.toleranceRetard} min`);
    console.log('   ═══════════════════════════════════════\n');

    // Créer ou mettre à jour Magasin 2
    const store2 = await prisma.storeConfig.upsert({
      where: { id: 2 },
      update: magasin2,
      create: { ...magasin2 },
    });

    console.log('✅ Magasin 2 configuré avec succès !');
    console.log('   ═══════════════════════════════════════');
    console.log(`   📌 Nom        : ${store2.nom}`);
    console.log(`   📍 Adresse    : ${store2.adresse || 'Non renseignée'}`);
    console.log(`   🌍 Latitude   : ${store2.latitude}`);
    console.log(`   🌍 Longitude  : ${store2.longitude}`);
    console.log(`   📏 Rayon      : ${store2.rayonTolerance}m`);
    console.log(`   🕐 Ouverture  : ${store2.heureOuverture}`);
    console.log(`   🕐 Fermeture  : ${store2.heureFermeture}`);
    console.log(`   ⏱️  Tolérance : ${store2.toleranceRetard} min`);
    console.log('   ═══════════════════════════════════════\n');

    console.log('🎉 Les 2 magasins sont maintenant configurés !');
    console.log('📱 Les employés peuvent pointer leur présence depuis l\'application.\n');
    console.log('💡 Conseils :');
    console.log('   - Chaque employé peut pointer au magasin le plus proche');
    console.log('   - Le système détecte automatiquement le magasin le plus proche');
    console.log('   - Si trop de refus : augmentez le rayon (50m → 100m)');
    console.log('   - Testez d\'abord avec un employé avant déploiement complet\n');

    // Afficher l'URL Google Maps pour vérifier les coordonnées
    console.log('🗺️  Vérifier vos coordonnées sur Google Maps :');
    console.log(`   Magasin 1: https://www.google.com/maps?q=${store1.latitude},${store1.longitude}`);
    console.log(`   Magasin 2: https://www.google.com/maps?q=${store2.latitude},${store2.longitude}\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifiez que la migration a bien été appliquée (npx prisma migrate deploy)');
    console.error('   2. Vérifiez votre connexion à la base de données');
    console.error('   3. Vérifiez que les coordonnées GPS sont des nombres valides');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTwoStores();
