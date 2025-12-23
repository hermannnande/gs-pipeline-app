/**
 * 🔧 SCRIPT DE CORRECTION - STOCK EN LIVRAISON NÉGATIF
 * 
 * PROBLÈME :
 * Des commandes ont été marquées LIVREE avant l'implémentation
 * de la confirmation de remise, causant un stock en livraison négatif.
 * 
 * SOLUTION :
 * Corriger le stock en ajoutant les quantités manquantes dans stockLocalReserve
 * pour annuler le négatif causé par les anciennes livraisons.
 * 
 * UTILISATION :
 * node prisma/fix-negative-stock-livraison.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixNegativeStockLivraison() {
  console.log('🔍 Recherche des commandes problématiques...\n');

  try {
    // 1. Trouver toutes les commandes LIVREE (LOCAL) 
    //    où la tournée n'a PAS de confirmation de remise
    const commandesProblematiques = await prisma.order.findMany({
      where: {
        status: 'LIVREE',
        deliveryType: 'LOCAL',
        productId: { not: null },
        OR: [
          // Commandes sans tournée (anciennes)
          { deliveryListId: null },
          // OU commandes avec tournée mais sans confirmation de remise
          {
            deliveryList: {
              tourneeStock: {
                colisRemisConfirme: false
              }
            }
          },
          // OU commandes avec tournée mais PAS de TourneeStock du tout
          {
            deliveryList: {
              tourneeStock: null
            }
          }
        ]
      },
      include: {
        product: true,
        deliveryList: {
          include: {
            tourneeStock: true
          }
        },
        deliverer: {
          select: { nom: true, prenom: true }
        }
      },
      orderBy: {
        deliveredAt: 'asc'
      }
    });

    console.log(`📊 Commandes trouvées : ${commandesProblematiques.length}\n`);

    if (commandesProblematiques.length === 0) {
      console.log('✅ Aucune commande problématique trouvée !');
      console.log('Le stock est déjà cohérent.\n');
      return;
    }

    // 2. Afficher le résumé par produit
    const produitsImpactes = {};
    commandesProblematiques.forEach(cmd => {
      if (!produitsImpactes[cmd.productId]) {
        produitsImpactes[cmd.productId] = {
          nom: cmd.product.nom,
          code: cmd.product.code,
          quantite: 0,
          commandes: []
        };
      }
      produitsImpactes[cmd.productId].quantite += cmd.quantite;
      produitsImpactes[cmd.productId].commandes.push({
        ref: cmd.orderReference,
        quantite: cmd.quantite,
        date: cmd.deliveredAt,
        livreur: cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'N/A'
      });
    });

    console.log('📦 RÉSUMÉ DES PRODUITS IMPACTÉS :\n');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    
    for (const [productId, data] of Object.entries(produitsImpactes)) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      console.log(`│ ${data.nom.padEnd(40)} │`);
      console.log(`│ Code: ${data.code.padEnd(51)} │`);
      console.log(`│ ─────────────────────────────────────────────────────────────── │`);
      console.log(`│ Stock disponible actuel    : ${String(product.stockActuel).padStart(5)} │`);
      console.log(`│ Stock en livraison actuel  : ${String(product.stockLocalReserve).padStart(5)} │`);
      console.log(`│ Quantité à corriger        : ${String(data.quantite).padStart(5)} │`);
      console.log(`│ Nombre de commandes        : ${String(data.commandes.length).padStart(5)} │`);
      console.log('├─────────────────────────────────────────────────────────────────┤');
    }
    console.log('└─────────────────────────────────────────────────────────────────┘\n');

    // 3. Afficher les détails des commandes
    console.log('📋 DÉTAILS DES COMMANDES :\n');
    for (const [productId, data] of Object.entries(produitsImpactes)) {
      console.log(`\n🔹 ${data.nom} (${data.code})`);
      data.commandes.forEach((cmd, idx) => {
        console.log(`   ${idx + 1}. ${cmd.ref} - Qté: ${cmd.quantite} - Livré le: ${cmd.date?.toLocaleDateString('fr-FR') || 'N/A'} - Livreur: ${cmd.livreur}`);
      });
    }

    console.log('\n\n⚠️  ATTENTION : Cette opération va corriger le stock de manière permanente.\n');
    console.log('❓ Voulez-vous continuer ? (y/n)\n');

    // Attendre confirmation (en production, utiliser readline)
    // Pour ce script, on va demander un argument --confirm
    const args = process.argv.slice(2);
    const confirmed = args.includes('--confirm');

    if (!confirmed) {
      console.log('❌ Correction annulée.');
      console.log('\n💡 Pour exécuter la correction, utilisez :');
      console.log('   node prisma/fix-negative-stock-livraison.js --confirm\n');
      return;
    }

    console.log('\n🔧 DÉBUT DE LA CORRECTION...\n');

    // 4. Appliquer les corrections dans une transaction
    const corrections = await prisma.$transaction(async (tx) => {
      const mouvements = [];

      for (const [productId, data] of Object.entries(produitsImpactes)) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(productId) }
        });

        const stockLocalReserveAvant = product.stockLocalReserve;
        const stockLocalReserveApres = stockLocalReserveAvant + data.quantite;

        // Mettre à jour le stock en livraison (annuler le négatif)
        await tx.product.update({
          where: { id: parseInt(productId) },
          data: {
            stockLocalReserve: stockLocalReserveApres
          }
        });

        // Créer le mouvement de correction
        const movement = await tx.stockMovement.create({
          data: {
            productId: parseInt(productId),
            type: 'CORRECTION',
            quantite: data.quantite,
            stockAvant: stockLocalReserveAvant,
            stockApres: stockLocalReserveApres,
            effectuePar: 1, // Admin
            motif: `CORRECTION AUTOMATIQUE - Anciennes livraisons (${data.commandes.length} commandes) effectuées avant l'implémentation de la confirmation de remise. Stock en livraison rétabli de ${stockLocalReserveAvant} à ${stockLocalReserveApres}.`
          }
        });

        mouvements.push({
          produit: data.nom,
          quantite: data.quantite,
          stockAvant: stockLocalReserveAvant,
          stockApres: stockLocalReserveApres,
          commandes: data.commandes.length
        });

        console.log(`✅ ${data.nom} : Stock en livraison corrigé (${stockLocalReserveAvant} → ${stockLocalReserveApres})`);
      }

      return mouvements;
    });

    console.log('\n\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !\n');
    console.log('📊 RÉSUMÉ DES CORRECTIONS :\n');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    
    corrections.forEach((corr, idx) => {
      console.log(`│ ${(idx + 1) + '. ' + corr.produit.substring(0, 35).padEnd(38)} │`);
      console.log(`│    Quantité corrigée     : ${String(corr.quantite).padStart(5)} unités           │`);
      console.log(`│    Stock avant           : ${String(corr.stockAvant).padStart(5)} unités           │`);
      console.log(`│    Stock après           : ${String(corr.stockApres).padStart(5)} unités           │`);
      console.log(`│    Commandes traitées    : ${String(corr.commandes).padStart(5)}                  │`);
      if (idx < corrections.length - 1) {
        console.log('├─────────────────────────────────────────────────────────────────┤');
      }
    });
    console.log('└─────────────────────────────────────────────────────────────────┘\n');

    // 5. Vérifier les nouveaux stocks
    console.log('🔍 VÉRIFICATION DES STOCKS APRÈS CORRECTION :\n');
    for (const [productId, data] of Object.entries(produitsImpactes)) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      console.log(`📦 ${data.nom}`);
      console.log(`   Stock disponible       : ${product.stockActuel}`);
      console.log(`   Stock en livraison     : ${product.stockLocalReserve} ${product.stockLocalReserve < 0 ? '❌ ENCORE NÉGATIF' : '✅'}`);
      console.log(`   Stock EXPRESS          : ${product.stockExpress}`);
      console.log(`   Stock total            : ${product.stockActuel + product.stockExpress + product.stockLocalReserve}\n`);
    }

    console.log('🎉 Le stock est maintenant cohérent !');
    console.log('📝 Les mouvements de correction ont été créés dans l\'historique.\n');

  } catch (error) {
    console.error('❌ ERREUR lors de la correction :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixNegativeStockLivraison()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error);
    process.exit(1);
  });

