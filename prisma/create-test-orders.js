import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Création de commandes de test...\n');

  // Récupérer les utilisateurs et produits existants
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const appelant = await prisma.user.findFirst({ where: { role: 'APPELANT' } });
  const livreur = await prisma.user.findFirst({ where: { role: 'LIVREUR' } });
  const gestionnaire = await prisma.user.findFirst({ where: { role: 'GESTIONNAIRE' } });

  const produits = await prisma.product.findMany();
  
  if (!produits.length) {
    console.log('❌ Aucun produit trouvé. Exécutez d\'abord le seed.');
    return;
  }

  const produit1 = produits[0]; // Montre
  const produit2 = produits[1]; // Écouteurs
  const produit3 = produits[2]; // Batterie

  // Données clients pour les tests
  const clients = [
    {
      nom: 'Diallo Mamadou',
      telephone: '+221771234567',
      ville: 'Dakar',
      commune: 'Plateau',
      adresse: 'Avenue Georges Pompidou, Immeuble 12'
    },
    {
      nom: 'Traoré Aminata',
      telephone: '+221772345678',
      ville: 'Dakar',
      commune: 'Almadies',
      adresse: 'Route de Ngor, Villa 45'
    },
    {
      nom: 'Ndiaye Cheikh',
      telephone: '+221773456789',
      ville: 'Thiès',
      commune: 'Thiès Nord',
      adresse: 'Quartier Escale, Rue 15'
    },
    {
      nom: 'Sow Fatou',
      telephone: '+221774567890',
      ville: 'Dakar',
      commune: 'Grand Yoff',
      adresse: 'Cité Millionnaire, Maison 78'
    },
    {
      nom: 'Ba Ousmane',
      telephone: '+221775678901',
      ville: 'Saint-Louis',
      commune: 'Saint-Louis Centre',
      adresse: 'Île de Saint-Louis, Rue Blanchot'
    },
    {
      nom: 'Kane Aissatou',
      telephone: '+221776789012',
      ville: 'Dakar',
      commune: 'Parcelles Assainies',
      adresse: 'Unité 12, Maison 234'
    },
    {
      nom: 'Sarr Ibrahima',
      telephone: '+221777890123',
      ville: 'Rufisque',
      commune: 'Rufisque Ouest',
      adresse: 'Avenue Léopold Sédar Senghor'
    },
    {
      nom: 'Sy Mariama',
      telephone: '+221778901234',
      ville: 'Dakar',
      commune: 'Sacré-Cœur',
      adresse: 'Rue SC-55, Résidence Les Jardins'
    },
    {
      nom: 'Fall Moussa',
      telephone: '+221779012345',
      ville: 'Mbour',
      commune: 'Mbour Centre',
      adresse: 'Route de Saly, Quartier Thiocé'
    },
    {
      nom: 'Diop Khady',
      telephone: '+221770123456',
      ville: 'Dakar',
      commune: 'Mermoz',
      adresse: 'Cité Mermoz, Villa 89'
    },
    {
      nom: 'Cissé Moustapha',
      telephone: '+221771111111',
      ville: 'Dakar',
      commune: 'Ouakam',
      adresse: 'Route des Mamelles, Villa 23'
    },
    {
      nom: 'Gueye Awa',
      telephone: '+221772222222',
      ville: 'Dakar',
      commune: 'Liberté 6',
      adresse: 'Extension Liberté 6, Maison 156'
    }
  ];

  const commandes = [];

  // 1. Commandes NOUVELLES (6)
  console.log('📦 Création de commandes NOUVELLES...');
  for (let i = 0; i < 6; i++) {
    const client = clients[i];
    const produit = [produit1, produit2, produit3, produit1, produit2, produit3][i];
    
    const order = await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.telephone,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: i % 2 === 0 ? 1 : 2,
        montant: produit.prixUnitaire * (i % 2 === 0 ? 1 : 2),
        sourceCampagne: ['Facebook Ads', 'Instagram', 'Google Ads'][i % 3],
        sourcePage: 'landing-produits',
        status: 'NOUVELLE'
      }
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'NOUVELLE',
        changedBy: admin.id,
        comment: 'Commande reçue via formulaire web'
      }
    });

    commandes.push(order);
  }

  // 2. Commandes À APPELER (3)
  console.log('📞 Création de commandes À APPELER...');
  for (let i = 6; i < 9; i++) {
    const client = clients[i];
    const produit = [produit2, produit3, produit1][i - 6];
    
    const order = await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.telephone,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: 1,
        montant: produit.prixUnitaire,
        sourceCampagne: 'TikTok Ads',
        sourcePage: 'landing-promo',
        status: 'A_APPELER'
      }
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'A_APPELER',
        changedBy: admin.id,
        comment: 'Prête pour appel'
      }
    });

    commandes.push(order);
  }

  // 3. Commandes VALIDÉES (3)
  console.log('✅ Création de commandes VALIDÉES...');
  for (let i = 9; i < 12; i++) {
    const client = clients[i];
    const produit = [produit1, produit2, produit3][i - 9];
    
    const order = await prisma.order.create({
      data: {
        clientNom: client.nom,
        clientTelephone: client.telephone,
        clientVille: client.ville,
        clientCommune: client.commune,
        clientAdresse: client.adresse,
        produitNom: produit.nom,
        productId: produit.id,
        quantite: i % 2 === 0 ? 2 : 1,
        montant: produit.prixUnitaire * (i % 2 === 0 ? 2 : 1),
        sourceCampagne: 'WhatsApp',
        sourcePage: 'landing-flash',
        status: 'VALIDEE',
        callerId: appelant.id,
        calledAt: new Date(),
        validatedAt: new Date(),
        noteAppelant: 'Client intéressé, confirme la commande'
      }
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'VALIDEE',
        changedBy: appelant.id,
        comment: 'Commande validée par téléphone'
      }
    });

    commandes.push(order);
  }

  console.log('\n✅ Résumé des commandes créées:');
  console.log('-----------------------------');
  console.log(`📦 ${commandes.filter(c => c.status === 'NOUVELLE').length} commandes NOUVELLES`);
  console.log(`📞 ${commandes.filter(c => c.status === 'A_APPELER').length} commandes À APPELER`);
  console.log(`✅ ${commandes.filter(c => c.status === 'VALIDEE').length} commandes VALIDÉES`);
  console.log(`\n🎯 Total: ${commandes.length} commandes de test créées!`);
  
  console.log('\n📋 Détail des commandes par produit:');
  for (const produit of produits) {
    const count = commandes.filter(c => c.productId === produit.id).length;
    console.log(`   ${produit.nom}: ${count} commandes`);
  }

  console.log('\n💡 Vous pouvez maintenant:');
  console.log('   1. Tester les appels (Appelant)');
  console.log('   2. Créer des tournées (Gestionnaire)');
  console.log('   3. Gérer le stock (Gestionnaire Stock)');
  console.log('   4. Effectuer des livraisons (Livreur)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

