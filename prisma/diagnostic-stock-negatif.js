/**
 * 🔍 DIAGNOSTIC APPROFONDI - STOCK EN LIVRAISON NÉGATIF
 * 
 * Ce script analyse en détail tous les mouvements de stock
 * pour comprendre EXACTEMENT pourquoi le stock est négatif.
 * 
 * UTILISATION :
 * node prisma/diagnostic-stock-negatif.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnosticStockNegatif() {
  console.log('🔍 DIAGNOSTIC APPROFONDI DU STOCK NÉGATIF\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Trouver tous les produits avec stock en livraison négatif
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      },
      orderBy: {
        stockLocalReserve: 'asc'
      }
    });

    if (produitsNegatifs.length === 0) {
      console.log('✅ Aucun produit avec stock en livraison négatif !\n');
      return;
    }

    console.log(`📊 Produits avec stock négatif : ${produitsNegatifs.length}\n`);

    for (const produit of produitsNegatifs) {
      console.log('\n┌─────────────────────────────────────────────────────────────┐');
      console.log(`│ 📦 ${produit.nom.padEnd(57)} │`);
      console.log(`│ Code: ${produit.code.padEnd(53)} │`);
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ Stock disponible         : ${String(produit.stockActuel).padStart(6)} unités        │`);
      console.log(`│ Stock EXPRESS (réservé)  : ${String(produit.stockExpress).padStart(6)} unités        │`);
      console.log(`│ Stock en livraison       : ${String(produit.stockLocalReserve).padStart(6)} unités ❌     │`);
      console.log(`│ ────────────────────────────────────────────────────────── │`);
      console.log(`│ Stock total (calculé)    : ${String(produit.stockActuel + produit.stockExpress + produit.stockLocalReserve).padStart(6)} unités        │`);
      console.log('└─────────────────────────────────────────────────────────────┘\n');

      // 2. Analyser TOUS les mouvements de stock pour ce produit
      console.log('📋 HISTORIQUE COMPLET DES MOUVEMENTS DE STOCK :\n');

      const mouvements = await prisma.stockMovement.findMany({
        where: { productId: produit.id },
        orderBy: { createdAt: 'asc' },
        include: {
          effectuePar: {
            select: { nom: true, prenom: true, role: true }
          },
          order: {
            select: { 
              orderReference: true, 
              status: true,
              deliveryType: true,
              clientNom: true
            }
          }
        }
      });

      if (mouvements.length === 0) {
        console.log('   ℹ️  Aucun mouvement de stock enregistré\n');
      } else {
        let stockActuelSimule = 0;
        let stockLocalReserveSimule = 0;
        let stockExpressSimule = 0;

        mouvements.forEach((mvt, idx) => {
          const date = mvt.createdAt.toLocaleString('fr-FR');
          const user = mvt.effectuePar ? `${mvt.effectuePar.prenom} ${mvt.effectuePar.nom} (${mvt.effectuePar.role})` : 'N/A';
          
          console.log(`\n   ${idx + 1}. [${date}]`);
          console.log(`      Type         : ${mvt.type}`);
          console.log(`      Quantité     : ${mvt.quantite > 0 ? '+' : ''}${mvt.quantite}`);
          console.log(`      Stock avant  : ${mvt.stockAvant}`);
          console.log(`      Stock après  : ${mvt.stockApres}`);
          console.log(`      Effectué par : ${user}`);
          console.log(`      Motif        : ${mvt.motif || 'N/A'}`);
          
          if (mvt.order) {
            console.log(`      Commande     : ${mvt.order.orderReference} (${mvt.order.status}) - ${mvt.order.clientNom}`);
          }

          // Simuler l'évolution du stock selon le type de mouvement
          if (['RESERVATION_LOCAL'].includes(mvt.type)) {
            stockActuelSimule += mvt.quantite;
            stockLocalReserveSimule -= mvt.quantite; // Car quantite est négative pour RESERVATION_LOCAL normalement
            console.log(`      → Stock dispo : ${stockActuelSimule}, Stock livraison : ${stockLocalReserveSimule}`);
          } else if (['LIVRAISON_LOCAL'].includes(mvt.type)) {
            stockLocalReserveSimule += mvt.quantite;
            console.log(`      → Stock livraison : ${stockLocalReserveSimule}`);
          } else if (['RETOUR_LOCAL'].includes(mvt.type)) {
            stockActuelSimule += mvt.quantite;
            stockLocalReserveSimule -= mvt.quantite;
            console.log(`      → Stock dispo : ${stockActuelSimule}, Stock livraison : ${stockLocalReserveSimule}`);
          } else if (['RESERVATION_EXPRESS', 'ANNULATION_EXPRESS'].includes(mvt.type)) {
            stockExpressSimule += mvt.quantite;
            stockActuelSimule -= mvt.quantite;
            console.log(`      → Stock dispo : ${stockActuelSimule}, Stock EXPRESS : ${stockExpressSimule}`);
          } else if (['RETRAIT_EXPRESS'].includes(mvt.type)) {
            stockExpressSimule += mvt.quantite;
            console.log(`      → Stock EXPRESS : ${stockExpressSimule}`);
          } else {
            stockActuelSimule += mvt.quantite;
            console.log(`      → Stock dispo : ${stockActuelSimule}`);
          }
        });

        console.log('\n   ═══════════════════════════════════════════════════════');
        console.log(`   📊 TOTAL MOUVEMENTS : ${mouvements.length}`);
      }

      // 3. Analyser les commandes LIVREE pour ce produit
      console.log('\n\n📦 COMMANDES LIVRÉES POUR CE PRODUIT :\n');

      const commandesLivrees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: 'LIVREE',
          deliveryType: 'LOCAL'
        },
        orderBy: { deliveredAt: 'asc' },
        include: {
          deliverer: {
            select: { nom: true, prenom: true }
          },
          deliveryList: {
            include: {
              tourneeStock: true
            }
          }
        }
      });

      if (commandesLivrees.length === 0) {
        console.log('   ℹ️  Aucune commande livrée\n');
      } else {
        console.log(`   Total : ${commandesLivrees.length} commande(s)\n`);

        let avecRemiseConfirmee = 0;
        let sansRemiseConfirmee = 0;
        let sansTournee = 0;

        commandesLivrees.forEach((cmd, idx) => {
          const livreur = cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'N/A';
          const dateLivraison = cmd.deliveredAt ? cmd.deliveredAt.toLocaleDateString('fr-FR') : 'N/A';
          
          let statutRemise = '❓ Pas de tournée';
          if (cmd.deliveryList) {
            if (cmd.deliveryList.tourneeStock && cmd.deliveryList.tourneeStock.colisRemisConfirme) {
              statutRemise = '✅ Remise confirmée';
              avecRemiseConfirmee++;
            } else if (cmd.deliveryList.tourneeStock) {
              statutRemise = '❌ Remise NON confirmée';
              sansRemiseConfirmee++;
            } else {
              statutRemise = '⚠️ Pas de TourneeStock';
              sansRemiseConfirmee++;
            }
          } else {
            sansTournee++;
          }

          console.log(`   ${idx + 1}. ${cmd.orderReference}`);
          console.log(`      Client      : ${cmd.clientNom}`);
          console.log(`      Quantité    : ${cmd.quantite}`);
          console.log(`      Livreur     : ${livreur}`);
          console.log(`      Livré le    : ${dateLivraison}`);
          console.log(`      Statut      : ${statutRemise}`);
          console.log('');
        });

        console.log('   ═══════════════════════════════════════════════════════');
        console.log(`   ✅ Avec remise confirmée    : ${avecRemiseConfirmee}`);
        console.log(`   ❌ Sans remise confirmée    : ${sansRemiseConfirmee}`);
        console.log(`   ❓ Sans tournée             : ${sansTournee}`);
        console.log(`   ────────────────────────────────────────────────────`);
        console.log(`   📊 TOTAL                    : ${commandesLivrees.length}`);
      }

      // 4. Calculer le stock théorique
      console.log('\n\n🧮 CALCUL DU STOCK THÉORIQUE :\n');

      // Stock qui devrait être en livraison
      const commandesAssignees = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: { in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'] },
          deliveryType: 'LOCAL',
          deliveryList: {
            tourneeStock: {
              colisRemisConfirme: true,
              colisRetourConfirme: false
            }
          }
        }
      });

      const quantiteTheorique = commandesAssignees.reduce((sum, cmd) => sum + cmd.quantite, 0);

      console.log(`   Commandes confirmées REMISES mais pas encore livrées : ${commandesAssignees.length}`);
      console.log(`   Quantité théorique en livraison                      : ${quantiteTheorique}`);
      console.log(`   Quantité réelle en livraison (DB)                    : ${produit.stockLocalReserve}`);
      console.log(`   ────────────────────────────────────────────────────`);
      console.log(`   ÉCART                                                 : ${produit.stockLocalReserve - quantiteTheorique}`);

      if (produit.stockLocalReserve !== quantiteTheorique) {
        console.log(`\n   ⚠️  INCOHÉRENCE DÉTECTÉE !`);
        console.log(`   Le stock en livraison (${produit.stockLocalReserve}) ne correspond pas`);
        console.log(`   au nombre de commandes réellement en livraison (${quantiteTheorique})`);
        console.log(`\n   💡 Cela confirme qu'il y a eu des livraisons SANS confirmation de remise.`);
      }

      // 5. Recommandation de correction
      console.log('\n\n💊 RECOMMANDATION DE CORRECTION :\n');

      const correctionNecessaire = Math.abs(produit.stockLocalReserve - quantiteTheorique);
      
      if (produit.stockLocalReserve < 0) {
        console.log(`   Pour ramener le stock en livraison à ${quantiteTheorique},`);
        console.log(`   il faut AJOUTER ${correctionNecessaire} unités.\n`);
        console.log(`   Cela annulera l'effet des ${commandesLivrees.length} livraisons qui ont`);
        console.log(`   décrémenté le stock alors qu'il n'avait jamais été incrémenté.`);
      } else if (produit.stockLocalReserve > quantiteTheorique) {
        console.log(`   Pour ramener le stock en livraison à ${quantiteTheorique},`);
        console.log(`   il faut RETIRER ${correctionNecessaire} unités.\n`);
      } else {
        console.log(`   ✅ Le stock est cohérent !`);
      }

      console.log('\n═══════════════════════════════════════════════════════════════\n');
    }

    // Résumé global
    console.log('\n📊 RÉSUMÉ GLOBAL :\n');
    console.log(`Nombre de produits avec stock négatif : ${produitsNegatifs.length}`);
    
    const totalCorrection = produitsNegatifs.reduce((sum, p) => sum + Math.abs(p.stockLocalReserve), 0);
    console.log(`Correction totale nécessaire : ${totalCorrection} unités\n`);

    console.log('💡 PROCHAINE ÉTAPE :');
    console.log('   Exécutez le script de correction :');
    console.log('   node prisma/fix-negative-stock-livraison.js --confirm\n');

  } catch (error) {
    console.error('❌ ERREUR lors du diagnostic :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnosticStockNegatif()
  .then(() => {
    console.log('✅ Diagnostic terminé.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error);
    process.exit(1);
  });

