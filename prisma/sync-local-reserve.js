import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncLocalReserve() {
  console.log('🔄 Synchronisation du stock en livraison locale...\n');

  try {
    // 1. Récupérer toutes les commandes ASSIGNEE (avec les livreurs) en LOCAL
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL',
        productId: { not: null }
      },
      include: {
        product: true,
        deliverer: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });

    console.log(`📦 Commandes trouvées avec les livreurs: ${ordersInDelivery.length}`);
    
    if (ordersInDelivery.length === 0) {
      console.log('✅ Aucune commande en livraison. Le stock local réservé est correct.\n');
      return;
    }

    // 2. Calculer le stock réel en livraison par produit
    const stockByProduct = {};
    ordersInDelivery.forEach(order => {
      if (!stockByProduct[order.productId]) {
        stockByProduct[order.productId] = {
          productId: order.productId,
          productNom: order.product.nom,
          productCode: order.product.code,
          quantiteReelle: 0,
          quantiteEnregistree: order.product.stockLocalReserve || 0,
          commandes: []
        };
      }
      stockByProduct[order.productId].quantiteReelle += order.quantite;
      stockByProduct[order.productId].commandes.push({
        ref: order.orderReference,
        client: order.clientNom,
        quantite: order.quantite,
        livreur: order.deliverer ? `${order.deliverer.prenom} ${order.deliverer.nom}` : 'Non assigné'
      });
    });

    console.log('\n📊 ANALYSE PAR PRODUIT:\n');
    console.log('═'.repeat(100));
    
    const updates = [];
    let totalQuantite = 0;

    for (const [productId, data] of Object.entries(stockByProduct)) {
      const ecart = data.quantiteReelle - data.quantiteEnregistree;
      totalQuantite += data.quantiteReelle;
      
      console.log(`\n📦 ${data.productNom} (${data.productCode})`);
      console.log(`   Stock en livraison enregistré: ${data.quantiteEnregistree}`);
      console.log(`   Stock réel avec les livreurs: ${data.quantiteReelle}`);
      console.log(`   Écart: ${ecart > 0 ? '+' : ''}${ecart}`);
      console.log(`   Nombre de commandes: ${data.commandes.length}`);
      
      if (ecart !== 0) {
        console.log(`   ⚠️  CORRECTION NÉCESSAIRE`);
        updates.push({
          productId: parseInt(productId),
          productNom: data.productNom,
          ancien: data.quantiteEnregistree,
          nouveau: data.quantiteReelle,
          ecart
        });
      } else {
        console.log(`   ✅ Stock correct`);
      }
    }

    console.log('\n═'.repeat(100));
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   Total commandes en livraison: ${ordersInDelivery.length}`);
    console.log(`   Total produits avec livreurs: ${totalQuantite} unités`);
    console.log(`   Produits concernés: ${Object.keys(stockByProduct).length}`);
    console.log(`   Corrections nécessaires: ${updates.length}`);

    // 3. Appliquer les corrections si nécessaire
    if (updates.length > 0) {
      console.log('\n🔧 APPLICATION DES CORRECTIONS:\n');
      
      for (const update of updates) {
        await prisma.product.update({
          where: { id: update.productId },
          data: { stockLocalReserve: update.nouveau }
        });

        await prisma.stockMovement.create({
          data: {
            productId: update.productId,
            type: 'CORRECTION',
            quantite: update.ecart,
            stockAvant: update.ancien,
            stockApres: update.nouveau,
            effectuePar: 1, // Admin system
            motif: `Synchronisation initiale du stock en livraison - ${update.nouveau} unités avec les livreurs`
          }
        });

        console.log(`   ✅ ${update.productNom}: ${update.ancien} → ${update.nouveau} (${update.ecart > 0 ? '+' : ''}${update.ecart})`);
      }

      console.log('\n✅ Toutes les corrections ont été appliquées avec succès!\n');
    } else {
      console.log('\n✅ Aucune correction nécessaire. Le stock est déjà synchronisé!\n');
    }

    // 4. Remettre à zéro les produits qui n'ont plus de commandes en livraison
    const productsWithReserve = await prisma.product.findMany({
      where: {
        stockLocalReserve: { gt: 0 }
      }
    });

    const resetProducts = productsWithReserve.filter(
      p => !stockByProduct[p.id]
    );

    if (resetProducts.length > 0) {
      console.log('\n🔄 RÉINITIALISATION DES PRODUITS SANS COMMANDES:\n');
      
      for (const product of resetProducts) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stockLocalReserve: 0 }
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'CORRECTION',
            quantite: -product.stockLocalReserve,
            stockAvant: product.stockLocalReserve,
            stockApres: 0,
            effectuePar: 1,
            motif: 'Réinitialisation - Aucune commande en livraison'
          }
        });

        console.log(`   ✅ ${product.nom}: ${product.stockLocalReserve} → 0`);
      }
    }

    console.log('\n✅ SYNCHRONISATION TERMINÉE!\n');

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncLocalReserve();

