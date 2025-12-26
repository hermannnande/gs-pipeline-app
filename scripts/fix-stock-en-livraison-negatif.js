import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNegativeStockLocalReserve() {
  console.log('🔍 Recherche des produits avec stockLocalReserve négatif...\n');

  try {
    // 1. Trouver tous les produits avec stockLocalReserve négatif
    const productsWithNegativeStock = await prisma.product.findMany({
      where: {
        stockLocalReserve: {
          lt: 0
        }
      }
    });

    if (productsWithNegativeStock.length === 0) {
      console.log('✅ Aucun produit avec stockLocalReserve négatif trouvé.');
      return;
    }

    console.log(`❌ ${productsWithNegativeStock.length} produit(s) avec stockLocalReserve négatif trouvé(s):\n`);

    productsWithNegativeStock.forEach(product => {
      console.log(`  - [${product.code}] ${product.nom}`);
      console.log(`    Stock actuel: ${product.stockActuel}`);
      console.log(`    Stock en livraison (LOCAL): ${product.stockLocalReserve} ⚠️`);
      console.log(`    Stock EXPRESS: ${product.stockExpress}`);
      console.log('');
    });

    // 2. Demander confirmation
    console.log('⚠️  CORRECTION AUTOMATIQUE:');
    console.log('   - Mettre stockLocalReserve à 0 pour tous ces produits\n');

    // En production, vous devriez demander une confirmation
    // Pour l'instant, on procède automatiquement

    // 3. Corriger chaque produit
    for (const product of productsWithNegativeStock) {
      console.log(`🔧 Correction de [${product.code}] ${product.nom}...`);

      await prisma.product.update({
        where: { id: product.id },
        data: { stockLocalReserve: 0 }
      });

      // Créer un mouvement de stock pour tracer la correction
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'CORRECTION',
          quantite: -product.stockLocalReserve, // Quantité pour passer de négatif à 0
          stockAvant: product.stockLocalReserve,
          stockApres: 0,
          effectuePar: 1, // ID de l'admin - à ajuster selon votre base
          motif: `Correction automatique du stockLocalReserve négatif (${product.stockLocalReserve} → 0) suite à correction de la double logique de stock.`
        }
      });

      console.log(`   ✅ ${product.stockLocalReserve} → 0`);
      console.log('');
    }

    console.log('\n✅ Correction terminée avec succès!');
    console.log('\n📊 Vérification finale:');

    // 4. Vérifier que tout est corrigé
    const verification = await prisma.product.findMany({
      where: {
        stockLocalReserve: {
          lt: 0
        }
      }
    });

    if (verification.length === 0) {
      console.log('   ✅ Aucun produit avec stockLocalReserve négatif.');
    } else {
      console.log(`   ❌ ${verification.length} produit(s) encore négatif(s).`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixNegativeStockLocalReserve()
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

