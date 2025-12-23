/**
 * 🔧 RECALCUL CORRECT - Stock en Livraison
 * 
 * Calcule le stock en livraison basé sur les commandes réellement
 * en possession des livreurs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 RECALCUL DU STOCK EN LIVRAISON\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // 1. Récupérer toutes les commandes en livraison
    const commandesEnLivraison = await prisma.order.findMany({
      where: {
        deliveryType: 'LOCAL',
        status: {
          in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE']
        },
        productId: { not: null },
        deliveryList: {
          tourneeStock: {
            colisRemisConfirme: true,
            colisRetourConfirme: false
          }
        }
      },
      include: {
        product: true
      }
    });

    console.log(`📦 Commandes en livraison : ${commandesEnLivraison.length}\n`);

    // 2. Grouper par produit
    const parProduit = {};
    commandesEnLivraison.forEach(cmd => {
      if (!parProduit[cmd.productId]) {
        parProduit[cmd.productId] = {
          nom: cmd.product.nom,
          stockActuel: cmd.product.stockLocalReserve,
          quantiteReelle: 0
        };
      }
      parProduit[cmd.productId].quantiteReelle += cmd.quantite;
    });

    console.log('📊 RECALCUL NÉCESSAIRE :\n');
    
    let corrections = [];
    
    for (const [productId, data] of Object.entries(parProduit)) {
      const ecart = data.stockActuel - data.quantiteReelle;
      if (ecart !== 0) {
        console.log(`   ${data.nom}`);
        console.log(`      Stock actuel DB : ${data.stockActuel}`);
        console.log(`      Stock correct   : ${data.quantiteReelle}`);
        console.log(`      Correction      : ${ecart > 0 ? '-' : '+'}${Math.abs(ecart)}\n`);
        
        corrections.push({
          productId: parseInt(productId),
          nom: data.nom,
          stockAvant: data.stockActuel,
          stockApres: data.quantiteReelle,
          ecart
        });
      }
    }

    if (corrections.length === 0) {
      console.log('✅ Aucune correction nécessaire !\n');
      return;
    }

    console.log(`\n⚠️  ${corrections.length} produit(s) à corriger\n`);
    console.log('Pour confirmer, exécutez avec --confirm\n');

    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('❌ Correction annulée (ajoutez --confirm pour exécuter).\n');
      return;
    }

    console.log('🔧 APPLICATION DU RECALCUL...\n');

    for (const correction of corrections) {
      await prisma.product.update({
        where: { id: correction.productId },
        data: { stockLocalReserve: correction.stockApres }
      });

      await prisma.stockMovement.create({
        data: {
          productId: correction.productId,
          type: 'CORRECTION',
          quantite: Math.abs(correction.ecart),
          stockAvant: correction.stockAvant,
          stockApres: correction.stockApres,
          effectuePar: 1,
          motif: `RECALCUL AUTOMATIQUE - Stock en livraison ajusté de ${correction.stockAvant} à ${correction.stockApres} unités pour correspondre aux ${correction.stockApres} commandes réellement en livraison.`
        }
      });

      console.log(`✅ ${correction.nom}: ${correction.stockAvant} → ${correction.stockApres}`);
    }

    console.log('\n✅ RECALCUL TERMINÉ AVEC SUCCÈS !\n');

    // Vérification finale
    const verif = await prisma.order.count({
      where: {
        deliveryType: 'LOCAL',
        status: { in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'] },
        productId: { not: null },
        deliveryList: {
          tourneeStock: {
            colisRemisConfirme: true,
            colisRetourConfirme: false
          }
        }
      }
    });

    console.log(`🔍 Vérification : ${verif} commandes en livraison\n`);
    console.log('   Le stock en livraison correspond maintenant aux commandes réelles.\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

