import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('💰 Mise à jour des prix en Franc CFA (XOF)...\n');

  // Conversion approximative: 1 MAD ≈ 100 XOF
  const conversionRate = 100;

  const produits = await prisma.product.findMany();

  for (const produit of produits) {
    const newPrice = Math.round(produit.prixUnitaire * conversionRate);
    
    await prisma.product.update({
      where: { id: produit.id },
      data: { prixUnitaire: newPrice }
    });

    console.log(`✅ ${produit.nom}: ${produit.prixUnitaire} → ${newPrice} XOF`);
  }

  // Mettre à jour aussi les montants des commandes
  console.log('\n💰 Mise à jour des montants des commandes...');
  
  const commandes = await prisma.order.findMany({
    include: { product: true }
  });

  for (const commande of commandes) {
    if (commande.product) {
      const newMontant = commande.product.prixUnitaire * commande.quantite;
      
      await prisma.order.update({
        where: { id: commande.id },
        data: { montant: newMontant }
      });
    } else {
      // Pour les anciennes commandes sans produit lié
      const newMontant = Math.round(commande.montant * conversionRate);
      
      await prisma.order.update({
        where: { id: commande.id },
        data: { montant: newMontant }
      });
    }
  }

  console.log(`✅ ${commandes.length} commandes mises à jour\n`);

  console.log('📊 Résumé des nouveaux prix:');
  console.log('----------------------------');
  const produitsUpdated = await prisma.product.findMany();
  for (const p of produitsUpdated) {
    console.log(`${p.code} - ${p.nom}: ${p.prixUnitaire.toLocaleString('fr-FR')} XOF`);
  }

  console.log('\n✅ Conversion en Franc CFA terminée!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });








