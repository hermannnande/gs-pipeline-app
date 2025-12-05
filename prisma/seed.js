import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Créer un compte admin par défaut
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gs-pipeline.com' },
    update: {},
    create: {
      email: 'admin@gs-pipeline.com',
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'Système',
      telephone: '+212600000000',
      role: 'ADMIN',
      actif: true
    }
  });

  console.log('✅ Admin créé:', admin.email);

  // Créer un gestionnaire de test
  const gestionnaire = await prisma.user.upsert({
    where: { email: 'gestionnaire@gs-pipeline.com' },
    update: {},
    create: {
      email: 'gestionnaire@gs-pipeline.com',
      password: await bcrypt.hash('gestionnaire123', 10),
      nom: 'Dupont',
      prenom: 'Marie',
      telephone: '+212611111111',
      role: 'GESTIONNAIRE',
      actif: true
    }
  });

  console.log('✅ Gestionnaire créé:', gestionnaire.email);

  // Créer un appelant de test
  const appelant = await prisma.user.upsert({
    where: { email: 'appelant@gs-pipeline.com' },
    update: {},
    create: {
      email: 'appelant@gs-pipeline.com',
      password: await bcrypt.hash('appelant123', 10),
      nom: 'Martin',
      prenom: 'Jean',
      telephone: '+212622222222',
      role: 'APPELANT',
      actif: true
    }
  });

  console.log('✅ Appelant créé:', appelant.email);

  // Créer un livreur de test
  const livreur = await prisma.user.upsert({
    where: { email: 'livreur@gs-pipeline.com' },
    update: {},
    create: {
      email: 'livreur@gs-pipeline.com',
      password: await bcrypt.hash('livreur123', 10),
      nom: 'Alami',
      prenom: 'Hassan',
      telephone: '+212633333333',
      role: 'LIVREUR',
      actif: true
    }
  });

  console.log('✅ Livreur créé:', livreur.email);

  // Créer un gestionnaire de stock de test
  const gestionnaireStock = await prisma.user.upsert({
    where: { email: 'stock@gs-pipeline.com' },
    update: {},
    create: {
      email: 'stock@gs-pipeline.com',
      password: await bcrypt.hash('stock123', 10),
      nom: 'Benjelloun',
      prenom: 'Karim',
      telephone: '+212644444444',
      role: 'GESTIONNAIRE_STOCK',
      actif: true
    }
  });

  console.log('✅ Gestionnaire de stock créé:', gestionnaireStock.email);

  // Créer quelques produits de test
  const produit1 = await prisma.product.create({
    data: {
      code: 'MON-001',
      nom: 'Montre Connectée Pro',
      description: 'Montre connectée avec fonctions santé et sport',
      prixUnitaire: 599.00,
      stockActuel: 50,
      stockAlerte: 10
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: produit1.id,
      type: 'APPROVISIONNEMENT',
      quantite: 50,
      stockAvant: 0,
      stockApres: 50,
      effectuePar: admin.id,
      motif: 'Stock initial'
    }
  });

  const produit2 = await prisma.product.create({
    data: {
      code: 'ECO-001',
      nom: 'Écouteurs Sans Fil',
      description: 'Écouteurs bluetooth avec réduction de bruit',
      prixUnitaire: 199.00,
      stockActuel: 100,
      stockAlerte: 20
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: produit2.id,
      type: 'APPROVISIONNEMENT',
      quantite: 100,
      stockAvant: 0,
      stockApres: 100,
      effectuePar: admin.id,
      motif: 'Stock initial'
    }
  });

  const produit3 = await prisma.product.create({
    data: {
      code: 'POW-001',
      nom: 'Batterie Externe 20000mAh',
      description: 'Batterie externe haute capacité avec charge rapide',
      prixUnitaire: 149.00,
      stockActuel: 75,
      stockAlerte: 15
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: produit3.id,
      type: 'APPROVISIONNEMENT',
      quantite: 75,
      stockAvant: 0,
      stockApres: 75,
      effectuePar: admin.id,
      motif: 'Stock initial'
    }
  });

  console.log('✅ Produits créés avec stock initial');

  // Créer quelques commandes de test liées aux produits
  const order1 = await prisma.order.create({
    data: {
      clientNom: 'Bennani Ahmed',
      clientTelephone: '+212655555555',
      clientVille: 'Casablanca',
      clientCommune: 'Maarif',
      clientAdresse: 'Rue 123, Appartement 5',
      produitNom: 'Montre Connectée Pro',
      produitPage: 'montre-connectee-pro',
      productId: produit1.id,
      quantite: 1,
      montant: 599.00,
      sourceCampagne: 'Facebook Ads',
      sourcePage: 'landing-montres',
      status: 'NOUVELLE'
    }
  });

  await prisma.statusHistory.create({
    data: {
      orderId: order1.id,
      newStatus: 'NOUVELLE',
      changedBy: admin.id,
      comment: 'Commande de test créée'
    }
  });

  const order2 = await prisma.order.create({
    data: {
      clientNom: 'El Fassi Fatima',
      clientTelephone: '+212666666666',
      clientVille: 'Rabat',
      clientCommune: 'Agdal',
      produitNom: 'Écouteurs Sans Fil',
      produitPage: 'ecouteurs-sans-fil',
      productId: produit2.id,
      quantite: 2,
      montant: 399.00,
      sourceCampagne: 'Google Ads',
      sourcePage: 'landing-audio',
      status: 'A_APPELER'
    }
  });

  await prisma.statusHistory.create({
    data: {
      orderId: order2.id,
      newStatus: 'A_APPELER',
      changedBy: admin.id,
      comment: 'Commande à appeler'
    }
  });

  console.log('✅ Commandes de test créées');

  console.log('\n📊 Résumé du seeding:');
  console.log('--------------------');
  console.log('Comptes créés:');
  console.log('  • Admin: admin@gs-pipeline.com / admin123');
  console.log('  • Gestionnaire: gestionnaire@gs-pipeline.com / gestionnaire123');
  console.log('  • Gestionnaire Stock: stock@gs-pipeline.com / stock123');
  console.log('  • Appelant: appelant@gs-pipeline.com / appelant123');
  console.log('  • Livreur: livreur@gs-pipeline.com / livreur123');
  console.log('\nProduits créés:');
  console.log('  • Montre Connectée Pro (MON-001) - Stock: 50');
  console.log('  • Écouteurs Sans Fil (ECO-001) - Stock: 100');
  console.log('  • Batterie Externe (POW-001) - Stock: 75');
  console.log('\n🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

