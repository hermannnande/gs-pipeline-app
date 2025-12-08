import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Ajout de produits et commandes supplémentaires...\n');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const appelant = await prisma.user.findFirst({ where: { role: 'APPELANT' } });
  const gestionnaire = await prisma.user.findFirst({ where: { role: 'GESTIONNAIRE' } });
  const livreur = await prisma.user.findFirst({ where: { role: 'LIVREUR' } });

  // ===========================
  // CRÉER 7 NOUVEAUX PRODUITS
  // ===========================
  console.log('📦 Création de nouveaux produits...');

  const nouveauxProduits = [
    {
      code: 'TEL-001',
      nom: 'Smartphone Android 128GB',
      description: 'Smartphone dernière génération avec caméra 48MP',
      prixUnitaire: 89900,
      stockActuel: 35,
      stockAlerte: 8
    },
    {
      code: 'TAB-001',
      nom: 'Tablette 10 pouces',
      description: 'Tablette tactile avec stylet inclus',
      prixUnitaire: 69900,
      stockActuel: 20,
      stockAlerte: 5
    },
    {
      code: 'CAM-001',
      nom: 'Caméra de Surveillance WiFi',
      description: 'Caméra HD avec vision nocturne',
      prixUnitaire: 24900,
      stockActuel: 60,
      stockAlerte: 10
    },
    {
      code: 'ENC-001',
      nom: 'Enceinte Bluetooth Premium',
      description: 'Enceinte portable avec son surround',
      prixUnitaire: 34900,
      stockActuel: 45,
      stockAlerte: 10
    },
    {
      code: 'CAS-001',
      nom: 'Casque Gaming RGB',
      description: 'Casque gaming avec micro antibruit',
      prixUnitaire: 29900,
      stockActuel: 30,
      stockAlerte: 8
    },
    {
      code: 'CHA-001',
      nom: 'Chargeur Rapide USB-C 65W',
      description: 'Chargeur multi-appareils avec 3 ports',
      prixUnitaire: 12900,
      stockActuel: 80,
      stockAlerte: 15
    },
    {
      code: 'ACC-001',
      nom: 'Support Téléphone Voiture',
      description: 'Support magnétique avec charge sans fil',
      prixUnitaire: 9900,
      stockActuel: 100,
      stockAlerte: 20
    }
  ];

  const produitsCreated = [];
  for (const p of nouveauxProduits) {
    const produit = await prisma.product.create({ data: p });
    
    // Créer le mouvement de stock initial
    await prisma.stockMovement.create({
      data: {
        productId: produit.id,
        type: 'APPROVISIONNEMENT',
        quantite: p.stockActuel,
        stockAvant: 0,
        stockApres: p.stockActuel,
        effectuePar: admin.id,
        motif: 'Stock initial - Nouvel approvisionnement'
      }
    });
    
    produitsCreated.push(produit);
    console.log(`  ✅ ${produit.code} - ${produit.nom}`);
  }

  // Récupérer tous les produits
  const tousLesProduits = await prisma.product.findMany();

  // ===========================
  // CRÉER 50 NOUVELLES COMMANDES
  // ===========================
  console.log('\n📞 Création de 50 nouvelles commandes...\n');

  const clients = [
    { nom: 'Mbaye Aminata', tel: '+221781111111', ville: 'Dakar', commune: 'Plateau', adresse: 'Avenue Léopold Sédar Senghor, Bureau 45' },
    { nom: 'Dieng Ibrahima', tel: '+221782222222', ville: 'Dakar', commune: 'Almadies', adresse: 'Route de Ngor, Résidence Marina' },
    { nom: 'Thiam Mariama', tel: '+221783333333', ville: 'Thiès', commune: 'Thiès Est', adresse: 'Quartier Randoulène, Maison 67' },
    { nom: 'Wade Cheikh', tel: '+221784444444', ville: 'Dakar', commune: 'Sacré-Cœur', adresse: 'Rue SC-23, Villa Les Roses' },
    { nom: 'Camara Fatou', tel: '+221785555555', ville: 'Saint-Louis', commune: 'Sor', adresse: 'Quartier Diamaguène, Lot 89' },
    { nom: 'Faye Ousmane', tel: '+221786666666', ville: 'Dakar', commune: 'Grand Yoff', adresse: 'Cité Assemblée, Maison 234' },
    { nom: 'Mbengue Awa', tel: '+221787777777', ville: 'Rufisque', commune: 'Rufisque Centre', adresse: 'Avenue Blaise Diagne' },
    { nom: 'Ndao Moussa', tel: '+221788888888', ville: 'Dakar', commune: 'Parcelles Assainies', adresse: 'Unité 15, Villa 456' },
    { nom: 'Samb Khady', tel: '+221789999999', ville: 'Mbour', commune: 'Mbour Nord', adresse: 'Route de Joal, Quartier Gouye Mbind' },
    { nom: 'Niang Mamadou', tel: '+221780000000', ville: 'Dakar', commune: 'Mermoz', adresse: 'VDN Extension, Résidence Excellence' },
    { nom: 'Seye Aissatou', tel: '+221781234560', ville: 'Dakar', commune: 'Liberté 6', adresse: 'Extension Liberté 6, Immeuble 78' },
    { nom: 'Seck Abdoulaye', tel: '+221782345671', ville: 'Dakar', commune: 'Ouakam', adresse: 'Route des Almadies, Villa 12' },
    { nom: 'Gaye Bineta', tel: '+221783456782', ville: 'Kaolack', commune: 'Kaolack Centre', adresse: 'Quartier Médina, Maison 90' },
    { nom: 'Diouf Modou', tel: '+221784567893', ville: 'Dakar', commune: 'Fann', adresse: 'Point E, Immeuble Horizon' },
    { nom: 'Sarr Coumba', tel: '+221785678904', ville: 'Ziguinchor', commune: 'Ziguinchor Centre', adresse: 'Quartier Boudody, Lot 34' },
    { nom: 'Tall Ibrahima', tel: '+221786789015', ville: 'Dakar', commune: 'HLM', adresse: 'HLM Grand Yoff, Villa 567' },
    { nom: 'Diatta Mariama', tel: '+221787890126', ville: 'Kolda', commune: 'Kolda Centre', adresse: 'Avenue Général de Gaulle' },
    { nom: 'Guèye Cheikh', tel: '+221788901237', ville: 'Dakar', commune: 'Ngor', adresse: 'Village de Ngor, Maison 123' },
    { nom: 'Sow Astou', tel: '+221789012348', ville: 'Louga', commune: 'Louga Centre', adresse: 'Quartier Keur Serigne Louga' },
    { nom: 'Cissé Papa', tel: '+221780123459', ville: 'Dakar', commune: 'Dieuppeul', adresse: 'Derklé, Villa 345' },
    { nom: 'Ba Fatimata', tel: '+221781111112', ville: 'Dakar', commune: 'Point E', adresse: 'Rue PE-12, Résidence Sahel' },
    { nom: 'Keita Lamine', tel: '+221782222223', ville: 'Dakar', commune: 'Sicap Liberté', adresse: 'Liberté 3, Villa 789' },
    { nom: 'Ly Ndeye', tel: '+221783333334', ville: 'Tambacounda', commune: 'Tamba Centre', adresse: 'Quartier Quartier Administratif' },
    { nom: 'Touré Amadou', tel: '+221784444445', ville: 'Dakar', commune: 'Yoff', adresse: 'Cité Air Afrique, Maison 901' },
    { nom: 'Diop Rokhaya', tel: '+221785555556', ville: 'Fatick', commune: 'Fatick Centre', adresse: 'Avenue Valdiodio Ndiaye' },
    { nom: 'Kane Bassirou', tel: '+221786666667', ville: 'Dakar', commune: 'Guédiawaye', adresse: 'Golf Sud, Maison 112' },
    { nom: 'Sène Adama', tel: '+221787777778', ville: 'Dakar', commune: 'Pikine', adresse: 'Pikine Ouest, Villa 234' },
    { nom: 'Bâ Oumou', tel: '+221788888889', ville: 'Diourbel', commune: 'Diourbel Centre', adresse: 'Quartier Ndame, Lot 56' },
    { nom: 'Fall Aliou', tel: '+221789999990', ville: 'Dakar', commune: 'Keur Massar', adresse: 'Zone de Recasement, Maison 678' },
    { nom: 'Diene Fatoumata', tel: '+221780000001', ville: 'Sédhiou', commune: 'Sédhiou Centre', adresse: 'Quartier Hamdallaye' },
  ];

  const campagnes = ['Facebook Ads', 'Instagram', 'Google Ads', 'TikTok', 'WhatsApp', 'YouTube Ads'];
  const pages = ['landing-promo', 'landing-flash', 'landing-tech', 'landing-noel', 'landing-special'];

  let commandesCreated = 0;

  // Répartition des statuts :
  // 15 NOUVELLE
  // 15 A_APPELER
  // 20 VALIDEE

  // 15 commandes NOUVELLES
  console.log('  📦 15 commandes NOUVELLES...');
  for (let i = 0; i < 15; i++) {
    const client = clients[i % clients.length];
    const produit = tousLesProduits[i % tousLesProduits.length];
    const qte = Math.random() > 0.7 ? 2 : 1;

    await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.tel,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: qte,
        montant: produit.prixUnitaire * qte,
        sourceCampagne: campagnes[Math.floor(Math.random() * campagnes.length)],
        sourcePage: pages[Math.floor(Math.random() * pages.length)],
        status: 'NOUVELLE',
        createdAt: new Date(Date.now() - Math.random() * 3600000) // Dans la dernière heure
      }
    });
    commandesCreated++;
  }

  // 15 commandes À APPELER
  console.log('  📞 15 commandes À APPELER...');
  for (let i = 15; i < 30; i++) {
    const client = clients[i % clients.length];
    const produit = tousLesProduits[i % tousLesProduits.length];
    const qte = Math.random() > 0.7 ? 2 : 1;

    await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.tel,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: qte,
        montant: produit.prixUnitaire * qte,
        sourceCampagne: campagnes[Math.floor(Math.random() * campagnes.length)],
        sourcePage: pages[Math.floor(Math.random() * pages.length)],
        status: 'A_APPELER',
        createdAt: new Date(Date.now() - Math.random() * 7200000) // Dans les 2 dernières heures
      }
    });
    commandesCreated++;
  }

  // 20 commandes VALIDÉES
  console.log('  ✅ 20 commandes VALIDÉES...');
  for (let i = 30; i < 50; i++) {
    const client = clients[i % clients.length];
    const produit = tousLesProduits[i % tousLesProduits.length];
    const qte = Math.random() > 0.6 ? 2 : 1;

    await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.tel,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: qte,
        montant: produit.prixUnitaire * qte,
        sourceCampagne: campagnes[Math.floor(Math.random() * campagnes.length)],
        sourcePage: pages[Math.floor(Math.random() * pages.length)],
        status: 'VALIDEE',
        callerId: appelant.id,
        calledAt: new Date(Date.now() - Math.random() * 3600000),
        validatedAt: new Date(Date.now() - Math.random() * 3600000),
        noteAppelant: [
          'Client très intéressé, confirme la commande',
          'Client demande livraison rapide',
          'Commande confirmée, paiement à la livraison',
          'Client satisfait, attend la livraison',
          'Commande validée par téléphone'
        ][Math.floor(Math.random() * 5)],
        createdAt: new Date(Date.now() - Math.random() * 10800000) // Dans les 3 dernières heures
      }
    });
    commandesCreated++;
  }

  console.log('\n✅ Résumé des données ajoutées:');
  console.log('================================');
  console.log(`📦 ${nouveauxProduits.length} nouveaux produits créés`);
  console.log(`📞 ${commandesCreated} nouvelles commandes créées`);
  console.log('   • 15 commandes NOUVELLES');
  console.log('   • 15 commandes À APPELER');
  console.log('   • 20 commandes VALIDÉES');

  console.log('\n📊 Total des produits dans le système:');
  const allProducts = await prisma.product.findMany();
  console.log(`   ${allProducts.length} produits au total`);
  for (const p of allProducts) {
    console.log(`   • ${p.code} - ${p.nom}: ${p.stockActuel} en stock`);
  }

  console.log('\n📈 Total des commandes dans le système:');
  const allOrders = await prisma.order.count();
  console.log(`   ${allOrders} commandes au total`);

  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true }
  });

  console.log('\n📋 Répartition par statut:');
  for (const stat of byStatus) {
    console.log(`   • ${stat.status}: ${stat._count.status} commandes`);
  }

  console.log('\n🎉 Données de test ajoutées avec succès!');
  console.log('\n💡 Vous pouvez maintenant tester:');
  console.log('   1. Page "À appeler" avec beaucoup plus de commandes');
  console.log('   2. Créer des tournées avec des produits variés');
  console.log('   3. Gérer le stock de 10 produits différents');
  console.log('   4. Tester les retours avec produits multiples');
  console.log('   5. Voir les statistiques avec plus de données');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });










