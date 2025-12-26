import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNegativeStockLocalReserve() {
  console.log('🔍 Analyse du stock en livraison et recalcul basé sur les livraisons réelles...\n');

  try {
    // 1. Trouver TOUS les produits (pas seulement les négatifs)
    const allProducts = await prisma.product.findMany({
      include: {
        orders: {
          where: {
            status: 'ASSIGNEE',
            deliveryType: 'LOCAL'
          },
          include: {
            deliverer: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 ${allProducts.length} produit(s) trouvé(s) au total.\n`);

    const productsToFix = [];

    // 2. Pour chaque produit, calculer le stock réel en livraison
    for (const product of allProducts) {
      // Calculer le stock LOCAL RÉEL basé sur les commandes ASSIGNEE
      const realStockLocalReserve = product.orders.reduce((sum, order) => {
        return sum + (order.quantite || 0);
      }, 0);

      const currentStockLocalReserve = product.stockLocalReserve || 0;

      // Si différence détectée
      if (realStockLocalReserve !== currentStockLocalReserve) {
        productsToFix.push({
          product,
          currentStock: currentStockLocalReserve,
          realStock: realStockLocalReserve,
          difference: realStockLocalReserve - currentStockLocalReserve,
          ordersInDelivery: product.orders
        });
      }
    }

    if (productsToFix.length === 0) {
      console.log('✅ Aucune incohérence détectée. Tous les stocks en livraison sont corrects.');
      return;
    }

    console.log(`⚠️  ${productsToFix.length} produit(s) avec incohérence de stock détecté(s):\n`);

    productsToFix.forEach(({ product, currentStock, realStock, difference, ordersInDelivery }) => {
      console.log(`  - [${product.code}] ${product.nom}`);
      console.log(`    Stock actuel (magasin): ${product.stockActuel}`);
      console.log(`    Stock en livraison (BDD): ${currentStock} ${currentStock < 0 ? '⚠️ NÉGATIF' : ''}`);
      console.log(`    Stock en livraison (RÉEL): ${realStock} ✅`);
      console.log(`    Différence: ${difference > 0 ? '+' : ''}${difference}`);
      
      if (ordersInDelivery.length > 0) {
        console.log(`    📋 ${ordersInDelivery.length} commande(s) en livraison:`);
        ordersInDelivery.forEach(order => {
          const livreurNom = order.deliverer 
            ? `${order.deliverer.nom} ${order.deliverer.prenom}` 
            : 'Non assigné';
          console.log(`       • #${order.orderReference} - ${order.quantite} unité(s) - ${livreurNom}`);
        });
      } else {
        console.log(`    📋 Aucune commande en livraison (stock devrait être à 0)`);
      }
      console.log('');
    });

    // 3. Demander confirmation
    console.log('⚠️  CORRECTION AUTOMATIQUE:');
    console.log('   - Recalculer le stockLocalReserve basé sur les commandes ASSIGNEE réelles\n');

    // 4. Corriger chaque produit
    for (const { product, currentStock, realStock, difference } of productsToFix) {
      console.log(`🔧 Correction de [${product.code}] ${product.nom}...`);

      await prisma.product.update({
        where: { id: product.id },
        data: { stockLocalReserve: realStock }
      });

      // Créer un mouvement de stock pour tracer la correction
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'CORRECTION',
          quantite: difference,
          stockAvant: currentStock,
          stockApres: realStock,
          effectuePar: 1, // ID de l'admin - à ajuster selon votre base
          motif: `Recalcul automatique du stockLocalReserve basé sur les commandes ASSIGNEE réelles. Correction de l'incohérence suite au bug de double logique (${currentStock} → ${realStock}).`
        }
      });

      console.log(`   ✅ ${currentStock} → ${realStock} (${difference > 0 ? '+' : ''}${difference})`);
      console.log('');
    }

    console.log('\n✅ Correction terminée avec succès!');
    console.log('\n📊 Vérification finale:');

    // 5. Vérifier que tout est corrigé
    const verificationProducts = await prisma.product.findMany({
      include: {
        orders: {
          where: {
            status: 'ASSIGNEE',
            deliveryType: 'LOCAL'
          }
        }
      }
    });

    let stillInconsistent = 0;
    for (const product of verificationProducts) {
      const realStock = product.orders.reduce((sum, order) => sum + (order.quantite || 0), 0);
      if (realStock !== product.stockLocalReserve) {
        stillInconsistent++;
      }
    }

    if (stillInconsistent === 0) {
      console.log('   ✅ Tous les stocks en livraison sont cohérents avec les commandes réelles.');
    } else {
      console.log(`   ❌ ${stillInconsistent} produit(s) encore incohérent(s).`);
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

