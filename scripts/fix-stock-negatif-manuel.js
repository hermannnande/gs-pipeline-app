/**
 * 🔧 SCRIPT MANUEL - Diagnostic et Correction Stock Négatif
 * 
 * Exécution sur Railway :
 * node scripts/fix-stock-negatif-manuel.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 DIAGNOSTIC DU STOCK NÉGATIF\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // 1. Trouver tous les produits avec stock négatif
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      },
      orderBy: {
        stockLocalReserve: 'asc'
      }
    });

    if (produitsNegatifs.length === 0) {
      console.log('✅ AUCUN PRODUIT AVEC STOCK NÉGATIF !\n');
      console.log('Tous les stocks sont cohérents.\n');
      return;
    }

    console.log(`📊 Produits avec stock négatif : ${produitsNegatifs.length}\n`);

    let totalCorrection = 0;

    for (const produit of produitsNegatifs) {
      console.log(`\n┌─────────────────────────────────────────────────────┐`);
      console.log(`│ 📦 ${produit.nom}`);
      console.log(`│ Code: ${produit.code}`);
      console.log(`├─────────────────────────────────────────────────────┤`);
      console.log(`│ Stock disponible      : ${produit.stockActuel} unités`);
      console.log(`│ Stock EXPRESS         : ${produit.stockExpress} unités`);
      console.log(`│ Stock en livraison    : ${produit.stockLocalReserve} unités ❌`);
      console.log(`│ Stock total           : ${produit.stockActuel + produit.stockExpress + produit.stockLocalReserve} unités`);
      console.log(`└─────────────────────────────────────────────────────┘`);

      // Analyser les commandes
      const commandesLivrees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: 'LIVREE',
          deliveryType: 'LOCAL'
        },
        include: {
          deliveryList: {
            include: {
              tourneeStock: true
            }
          }
        }
      });

      let avecRemise = 0;
      let sansRemise = 0;

      commandesLivrees.forEach(cmd => {
        if (cmd.deliveryList?.tourneeStock?.colisRemisConfirme) {
          avecRemise++;
        } else {
          sansRemise++;
        }
      });

      console.log(`\n  📦 Commandes LIVREE : ${commandesLivrees.length}`);
      console.log(`     ✅ Avec remise confirmée  : ${avecRemise}`);
      console.log(`     ❌ Sans remise confirmée  : ${sansRemise}`);

      const correction = Math.abs(produit.stockLocalReserve);
      totalCorrection += correction;

      console.log(`\n  💊 Correction nécessaire : +${correction} unités`);
    }

    console.log(`\n\n════════════════════════════════════════════════════════`);
    console.log(`📊 RÉSUMÉ GLOBAL :`);
    console.log(`   Produits avec stock négatif : ${produitsNegatifs.length}`);
    console.log(`   Correction totale nécessaire : ${totalCorrection} unités`);
    console.log(`════════════════════════════════════════════════════════\n`);

    // Demander confirmation
    console.log('⚠️  VOULEZ-VOUS APPLIQUER LA CORRECTION ?');
    console.log('   Pour confirmer, exécutez :');
    console.log('   node scripts/fix-stock-negatif-manuel.js --confirm\n');

    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('❌ Correction annulée (ajoutez --confirm pour exécuter).\n');
      return;
    }

    // Appliquer la correction
    console.log('\n🔧 APPLICATION DE LA CORRECTION...\n');

    const commandesProblematiques = await prisma.order.findMany({
      where: {
        status: 'LIVREE',
        deliveryType: 'LOCAL',
        productId: { not: null },
        OR: [
          { deliveryListId: null },
          {
            deliveryList: {
              tourneeStock: {
                colisRemisConfirme: false
              }
            }
          },
          {
            deliveryList: {
              tourneeStock: null
            }
          }
        ]
      },
      include: {
        product: true
      }
    });

    const produitsImpactes = {};
    commandesProblematiques.forEach(cmd => {
      if (!produitsImpactes[cmd.productId]) {
        produitsImpactes[cmd.productId] = {
          nom: cmd.product.nom,
          code: cmd.product.code,
          quantite: 0
        };
      }
      produitsImpactes[cmd.productId].quantite += cmd.quantite;
    });

    await prisma.$transaction(async (tx) => {
      for (const [productId, data] of Object.entries(produitsImpactes)) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(productId) }
        });

        const stockAvant = product.stockLocalReserve;
        const stockApres = stockAvant + data.quantite;

        await tx.product.update({
          where: { id: parseInt(productId) },
          data: { stockLocalReserve: stockApres }
        });

        await tx.stockMovement.create({
          data: {
            productId: parseInt(productId),
            type: 'CORRECTION',
            quantite: data.quantite,
            stockAvant,
            stockApres,
            effectuePar: 1,
            motif: `CORRECTION AUTOMATIQUE - Anciennes livraisons effectuées avant l'implémentation de la confirmation de remise. Stock rétabli de ${stockAvant} à ${stockApres}.`
          }
        });

        console.log(`✅ ${data.nom} : ${stockAvant} → ${stockApres}`);
      }
    });

    console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !\n');

    // Vérification finale
    const produitsApres = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      }
    });

    if (produitsApres.length === 0) {
      console.log('🎉 Tous les stocks sont maintenant positifs !\n');
    } else {
      console.log(`⚠️  Il reste ${produitsApres.length} produit(s) avec stock négatif.\n`);
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

