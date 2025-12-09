import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeAndFixStockCorrections() {
  console.log('🔍 Analyse des corrections de livraison...\n');

  try {
    // 1. Trouver toutes les commandes qui ont changé de LIVREE vers autre chose
    const statusHistories = await prisma.statusHistory.findMany({
      where: {
        oldStatus: 'LIVREE',
        newStatus: {
          in: ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE', 'ASSIGNEE']
        }
      },
      include: {
        order: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Trouvé ${statusHistories.length} correction(s) de statut LIVREE → autre\n`);

    if (statusHistories.length === 0) {
      console.log('✅ Aucune correction à traiter !');
      return;
    }

    // 2. Pour chaque correction, vérifier si un mouvement de RETOUR existe
    const correctionsToFix = [];

    for (const history of statusHistories) {
      if (!history.order || !history.order.productId) {
        console.log(`⚠️  Commande ${history.orderId} sans produit lié, ignorée`);
        continue;
      }

      // Chercher un mouvement de RETOUR pour cette commande après la correction
      const returnMovement = await prisma.stockMovement.findFirst({
        where: {
          orderId: history.orderId,
          type: 'RETOUR',
          createdAt: {
            gte: history.createdAt
          }
        }
      });

      if (!returnMovement) {
        // Pas de mouvement de retour = Stock pas corrigé !
        correctionsToFix.push({
          history,
          order: history.order,
          product: history.order.product
        });

        console.log(`❌ Correction manquante détectée :`);
        console.log(`   Commande: ${history.order.orderReference}`);
        console.log(`   Client: ${history.order.clientNom}`);
        console.log(`   Produit: ${history.order.product?.nom || history.order.produitNom}`);
        console.log(`   Quantité: ${history.order.quantite}`);
        console.log(`   Date: ${history.createdAt.toLocaleString('fr-FR')}`);
        console.log(`   Changement: LIVREE → ${history.newStatus}\n`);
      }
    }

    console.log(`\n📊 Résultat: ${correctionsToFix.length} stock(s) à réajuster\n`);

    if (correctionsToFix.length === 0) {
      console.log('✅ Tous les stocks sont déjà corrects !');
      return;
    }

    // 3. Demander confirmation
    console.log('🔧 Corrections à appliquer :\n');
    
    for (const correction of correctionsToFix) {
      const product = correction.product;
      const order = correction.order;
      
      console.log(`   ${product.nom}:`);
      console.log(`   - Stock actuel: ${product.stockActuel}`);
      console.log(`   - Stock après correction: ${product.stockActuel + order.quantite}`);
      console.log(`   - Commande: ${order.orderReference} (${order.clientNom})\n`);
    }

    console.log('⚠️  ATTENTION: Cette opération va modifier le stock des produits !');
    console.log('Exécutez avec --apply pour appliquer les corrections\n');

    // 4. Si --apply est passé en argument, appliquer les corrections
    if (process.argv.includes('--apply')) {
      console.log('🚀 Application des corrections...\n');

      for (const correction of correctionsToFix) {
        const { order, product, history } = correction;

        await prisma.$transaction(async (tx) => {
          const stockAvant = product.stockActuel;
          const stockApres = stockAvant + order.quantite;

          // Mettre à jour le stock
          await tx.product.update({
            where: { id: product.id },
            data: { stockActuel: stockApres }
          });

          // Créer le mouvement de stock de correction
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: 'RETOUR',
              quantite: order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: history.changedBy,
              motif: `🔧 Correction automatique - Stock réajusté suite à changement LIVREE → ${history.newStatus} - ${order.orderReference}`
            }
          });

          console.log(`✅ Corrigé: ${product.nom}`);
          console.log(`   Stock: ${stockAvant} → ${stockApres} (+${order.quantite})`);
          console.log(`   Commande: ${order.orderReference}\n`);
        });
      }

      console.log(`\n✅ ${correctionsToFix.length} stock(s) corrigé(s) avec succès !`);
    } else {
      console.log('ℹ️  Mode simulation uniquement. Utilisez --apply pour appliquer les corrections.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
analyzeAndFixStockCorrections();

