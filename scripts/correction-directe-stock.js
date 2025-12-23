/**
 * 🔧 CORRECTION DIRECTE - Remettre stock en livraison à 0
 * 
 * Ce script remet simplement stockLocalReserve à 0 pour tous les produits négatifs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 CORRECTION DIRECTE DU STOCK EN LIVRAISON\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Trouver tous les produits avec stock négatif
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      }
    });

    if (produitsNegatifs.length === 0) {
      console.log('✅ AUCUN PRODUIT AVEC STOCK NÉGATIF !\n');
      return;
    }

    console.log(`📊 ${produitsNegatifs.length} produit(s) avec stock en livraison négatif\n`);

    produitsNegatifs.forEach(p => {
      console.log(`   ${p.nom} (${p.code}): ${p.stockLocalReserve} → 0`);
    });

    console.log('\n⚠️  VOULEZ-VOUS REMETTRE TOUS CES STOCKS À 0 ?');
    console.log('   Pour confirmer, exécutez avec --confirm\n');

    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('❌ Correction annulée (ajoutez --confirm pour exécuter).\n');
      return;
    }

    console.log('\n🔧 APPLICATION DE LA CORRECTION...\n');

    for (const produit of produitsNegatifs) {
      const stockAvant = produit.stockLocalReserve;
      const correction = Math.abs(stockAvant);
      const stockApres = 0;

      await prisma.product.update({
        where: { id: produit.id },
        data: { stockLocalReserve: 0 }
      });

      await prisma.stockMovement.create({
        data: {
          productId: produit.id,
          type: 'CORRECTION',
          quantite: correction,
          stockAvant,
          stockApres,
          effectuePar: 1,
          motif: `CORRECTION MANUELLE - Stock en livraison négatif (${stockAvant}) remis à zéro. Toutes les commandes livrées avaient la remise confirmée.`
        }
      });

      console.log(`✅ ${produit.nom}: ${stockAvant} → 0`);
    }

    console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !\n');

    // Vérification
    const restants = await prisma.product.findMany({
      where: { stockLocalReserve: { lt: 0 } }
    });

    if (restants.length === 0) {
      console.log('🎉 Tous les stocks en livraison sont maintenant à 0 ou positifs !\n');
    } else {
      console.log(`⚠️  Il reste encore ${restants.length} produit(s) avec stock négatif.\n`);
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

