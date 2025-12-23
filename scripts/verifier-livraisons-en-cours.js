/**
 * 🔍 VÉRIFICATION - Page Livraisons en Cours
 * 
 * Vérifie que les données de la page correspondent à la réalité
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VÉRIFICATION - LIVRAISONS EN COURS\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // 1. Récupérer TOUTES les commandes "en possession du livreur"
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
        product: true,
        deliverer: {
          select: { id: true, nom: true, prenom: true }
        },
        deliveryList: {
          include: {
            tourneeStock: true
          }
        }
      }
    });

    console.log(`📦 Commandes en livraison (avec livreurs) : ${commandesEnLivraison.length}\n`);

    // 2. Grouper par produit
    const parProduit = {};
    commandesEnLivraison.forEach(cmd => {
      if (!parProduit[cmd.productId]) {
        parProduit[cmd.productId] = {
          nom: cmd.product.nom,
          code: cmd.product.code,
          stockLocalReserve: cmd.product.stockLocalReserve,
          quantiteCalculee: 0,
          commandes: []
        };
      }
      parProduit[cmd.productId].quantiteCalculee += cmd.quantite;
      parProduit[cmd.productId].commandes.push({
        ref: cmd.orderReference,
        quantite: cmd.quantite,
        livreur: cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'N/A',
        status: cmd.status
      });
    });

    console.log('📊 RÉSUMÉ PAR PRODUIT :\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');

    let toutCoherent = true;
    
    for (const [productId, data] of Object.entries(parProduit)) {
      const coherent = data.stockLocalReserve === data.quantiteCalculee;
      const symbol = coherent ? '✅' : '❌';
      
      console.log(`│ ${symbol} ${data.nom.substring(0, 40).padEnd(40)}`);
      console.log(`│    Stock en livraison DB    : ${String(data.stockLocalReserve).padStart(3)} unités`);
      console.log(`│    Quantité réelle calculée : ${String(data.quantiteCalculee).padStart(3)} unités`);
      
      if (!coherent) {
        console.log(`│    ⚠️  ÉCART : ${data.stockLocalReserve - data.quantiteCalculee}`);
        toutCoherent = false;
      }
      
      console.log(`│    Nombre de commandes : ${data.commandes.length}`);
      console.log('├─────────────────────────────────────────────────────────────┤');
    }
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    // 3. Grouper par livreur
    const parLivreur = {};
    commandesEnLivraison.forEach(cmd => {
      if (!cmd.delivererId) return;
      
      if (!parLivreur[cmd.delivererId]) {
        parLivreur[cmd.delivererId] = {
          nom: cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'N/A',
          quantite: 0,
          commandes: []
        };
      }
      parLivreur[cmd.delivererId].quantite += cmd.quantite;
      parLivreur[cmd.delivererId].commandes.push({
        ref: cmd.orderReference,
        produit: cmd.product.nom,
        quantite: cmd.quantite,
        status: cmd.status
      });
    });

    console.log('👤 RÉSUMÉ PAR LIVREUR :\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    
    for (const [delivererId, data] of Object.entries(parLivreur)) {
      console.log(`│ ${data.nom.padEnd(30)} │`);
      console.log(`│    Quantité totale : ${String(data.quantite).padStart(3)} unités`);
      console.log(`│    Commandes       : ${String(data.commandes.length).padStart(3)}`);
      console.log('├─────────────────────────────────────────────────────────────┤');
    }
    console.log('└─────────────────────────────────────────────────────────────┘\n');

    // 4. Vérifier les stocks négatifs
    const produitsNegatifs = await prisma.product.findMany({
      where: {
        stockLocalReserve: { lt: 0 }
      }
    });

    if (produitsNegatifs.length > 0) {
      console.log('⚠️  ATTENTION : Produits avec stock en livraison négatif :\n');
      produitsNegatifs.forEach(p => {
        console.log(`   ❌ ${p.nom} : ${p.stockLocalReserve}`);
      });
      console.log('');
      toutCoherent = false;
    }

    // 5. Résumé global
    console.log('\n════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ GLOBAL :');
    console.log(`   Commandes en livraison : ${commandesEnLivraison.length}`);
    console.log(`   Produits concernés     : ${Object.keys(parProduit).length}`);
    console.log(`   Livreurs actifs        : ${Object.keys(parLivreur).length}`);
    console.log(`   Quantité totale        : ${Object.values(parProduit).reduce((sum, p) => sum + p.quantiteCalculee, 0)} unités`);
    console.log('════════════════════════════════════════════════════════\n');

    if (toutCoherent) {
      console.log('✅ TOUT EST COHÉRENT !\n');
      console.log('   Le stock en livraison (stockLocalReserve) correspond');
      console.log('   exactement aux commandes réellement en possession des livreurs.\n');
    } else {
      console.log('⚠️  INCOHÉRENCES DÉTECTÉES !\n');
      console.log('   Des écarts ont été trouvés entre le stock en DB');
      console.log('   et les commandes réellement en livraison.\n');
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

