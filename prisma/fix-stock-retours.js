import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Correction de la logique de stock pour les retours...\n');

  // 1. Trouver tous les mouvements de type RETOUR
  const retoursMovements = await prisma.stockMovement.findMany({
    where: { type: 'RETOUR' },
    include: { product: true }
  });

  if (retoursMovements.length === 0) {
    console.log('✅ Aucun mouvement de retour incorrect trouvé.\n');
    return;
  }

  console.log(`⚠️  Trouvé ${retoursMovements.length} mouvements de retour incorrects à corriger.\n`);

  // 2. Pour chaque mouvement RETOUR, annuler l'augmentation de stock
  for (const movement of retoursMovements) {
    const product = movement.product;
    
    console.log(`📦 ${product.nom} (${product.code})`);
    console.log(`   Stock avant correction : ${product.stockActuel}`);
    console.log(`   Quantité incorrectement ajoutée : +${movement.quantite}`);
    
    // Corriger le stock en soustrayant la quantité qui avait été incorrectement ajoutée
    const stockCorrige = product.stockActuel - movement.quantite;
    
    await prisma.product.update({
      where: { id: product.id },
      data: { stockActuel: stockCorrige }
    });
    
    console.log(`   ✅ Stock après correction : ${stockCorrige}\n`);
  }

  // 3. Supprimer tous les mouvements de type RETOUR
  const deleted = await prisma.stockMovement.deleteMany({
    where: { type: 'RETOUR' }
  });

  console.log(`\n✅ ${deleted.count} mouvements de retour incorrects supprimés.\n`);

  // 4. Afficher un résumé des stocks corrigés
  console.log('📊 Résumé des stocks après correction:\n');
  const allProducts = await prisma.product.findMany({
    orderBy: { code: 'asc' }
  });

  for (const product of allProducts) {
    const alerte = product.stockActuel <= product.stockAlerte ? '⚠️ ' : '✅';
    console.log(`${alerte} ${product.code} - ${product.nom}: ${product.stockActuel} en stock`);
  }

  console.log('\n✅ Correction terminée !');
  console.log('\n📝 RÈGLE MÉTIER CORRIGÉE:');
  console.log('   • Commande LIVRÉE → Stock DÉCRÉMENTE ✅');
  console.log('   • Commande REFUSÉE/ANNULÉE → Stock INCHANGÉ ✅');
  console.log('   • Confirmation retour → AUCUN impact sur stock ✅');
  console.log('\n💡 Le stock ne diminue QUE lors d\'une vente réussie (livraison effectuée).');
  console.log('   Les produits refusés/annulés restent dans le stock tout au long du processus.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });










