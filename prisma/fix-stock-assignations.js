/**
 * Script de correction : Recalculer le stock local réservé
 * pour toutes les commandes assignées aux livreurs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStockAssignations() {
  try {
    console.log('🔄 Correction du stock local réservé...\n');

    // 1. Réinitialiser stockLocalReserve à 0 pour tous les produits
    const products = await prisma.product.findMany();
    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: { stockLocalReserve: 0 }
      });
    }
    console.log(`✅ ${products.length} produits réinitialisés (stockLocalReserve = 0)\n`);

    // 2. Trouver toutes les commandes ASSIGNEE avec deliveryType LOCAL
    const assignedOrders = await prisma.order.findMany({
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL',
        productId: { not: null }
      },
      include: {
        product: true,
        deliverer: true
      }
    });

    console.log(`📦 ${assignedOrders.length} commandes ASSIGNEE trouvées\n`);

    // 3. Recalculer le stock par produit
    const stockByProduct = {};
    
    assignedOrders.forEach(order => {
      if (!stockByProduct[order.productId]) {
        stockByProduct[order.productId] = {
          product: order.product,
          totalQuantite: 0,
          commandes: []
        };
      }
      stockByProduct[order.productId].totalQuantite += order.quantite;
      stockByProduct[order.productId].commandes.push({
        id: order.id,
        reference: order.orderReference,
        clientNom: order.clientNom,
        quantite: order.quantite,
        livreur: `${order.deliverer?.prenom} ${order.deliverer?.nom}`
      });
    });

    console.log('📊 Résultat par produit :\n');

    // 4. Mettre à jour le stock local réservé ET créer les mouvements manquants
    let totalCorrections = 0;
    for (const [productId, data] of Object.entries(stockByProduct)) {
      const product = data.product;
      const stockLocalReserveCalcule = data.totalQuantite;

      // Déplacer le stock : stockActuel → stockLocalReserve
      const stockActuelAvant = product.stockActuel;
      const stockActuelApres = stockActuelAvant - stockLocalReserveCalcule;
      const stockLocalReserveApres = stockLocalReserveCalcule;

      await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { 
          stockActuel: stockActuelApres,
          stockLocalReserve: stockLocalReserveApres
        }
      });

      // Créer UN mouvement de correction global par produit
      await prisma.stockMovement.create({
        data: {
          productId: parseInt(productId),
          type: 'CORRECTION',
          quantite: -stockLocalReserveCalcule, // Négatif car on retire du stock disponible
          stockAvant: stockActuelAvant,
          stockApres: stockActuelApres,
          effectuePar: 1, // Admin/System
          motif: `Correction automatique : ${data.commandes.length} commande(s) ASSIGNEE détectée(s) sans mouvement de stock`
        }
      });

      console.log(`✅ ${product.nom}`);
      console.log(`   • Stock disponible : ${stockActuelAvant} → ${stockActuelApres} (-${stockLocalReserveCalcule})`);
      console.log(`   • Stock en livraison : 0 → ${stockLocalReserveApres} (+${stockLocalReserveCalcule})`);
      console.log(`   • ${data.commandes.length} commande(s) concernée(s)`);
      data.commandes.forEach(cmd => {
        console.log(`     - ${cmd.reference} : ${cmd.clientNom} (×${cmd.quantite}) - Livreur: ${cmd.livreur}`);
      });
      console.log('');

      totalCorrections++;
    }

    console.log(`\n🎉 Correction terminée !`);
    console.log(`   • ${totalCorrections} produit(s) corrigé(s)`);
    console.log(`   • ${assignedOrders.length} commande(s) traitée(s)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStockAssignations();

