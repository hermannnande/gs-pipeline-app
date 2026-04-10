// Corriger les commandes injectées qui ont été associées aux mauvais produits
// Les commandes #15701 à #15792 ont utilisé le mauvais mapping

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api/webhook/make';
const API_KEY = '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf';

// Corrections à faire : ancien code → bon code
const FIXES = [
  { wrongCode: 'CHAUSSETTE_CHAUFFANTE', rightCode: 'CHAUSSETTE_DE_COMPRESSION', productName: 'chaussette de compression' },
  { wrongCode: 'PATCH_MINCEUR', rightCode: 'PATCH_MINCEUR_GLP', productName: 'patch minceur glp' },
  { wrongCode: 'SPRAY_MINCEUR', rightCode: 'CREME_MINCEUR', productName: 'creme minceur' },
  { wrongCode: 'SPRAY_DOULEUR', rightCode: 'PATCH_ANTI_DOULEUR', productName: 'patch anti douleur' },
];

// IDs des commandes injectées par produit (extrait du log d'injection)
const INJECTED_ORDERS = {
  'chaussette de compression': [15701, 15716, 15743, 15768],
  'patch minceur glp': [15702, 15708, 15709, 15713, 15715, 15720],
  'creme minceur': [15704, 15707, 15710, 15711, 15755, 15787],
  'patch anti douleur': [15714, 15740, 15756, 15791],
  // spray anti douleur envoie SPRAY_DOULEUR qui existe bien, mais il faut vérifier
  // si c'était "patch anti douleur" ou "spray anti douleur" dans le sheet original
};

// spray anti douleur → SPRAY_DOULEUR est correct (le produit existe avec ce code)
// patch anti douleur → a été mappé vers SPRAY_DOULEUR mais devrait être PATCH_ANTI_DOULEUR

async function main() {
  console.log('\n========================================');
  console.log('  Correction des produits mal associés');
  console.log('  Commandes #15701 à #15792');
  console.log('========================================\n');

  // Étape 1 : Récupérer les vrais productId via l'API products
  console.log('📡 Récupération des produits...\n');
  const prodRes = await fetch(API_URL.replace('/make', '/products'), {
    headers: { 'X-API-KEY': API_KEY },
  });
  const prodData = await prodRes.json();
  
  if (!prodData.success) {
    console.error('❌ Impossible de récupérer les produits:', prodData);
    process.exit(1);
  }

  const productsByCode = {};
  prodData.products.forEach(p => { productsByCode[p.product_key] = p; });

  console.log(`  ${prodData.count} produits chargés\n`);

  // Afficher les corrections prévues
  for (const fix of FIXES) {
    const wrongProd = productsByCode[fix.wrongCode];
    const rightProd = productsByCode[fix.rightCode];
    const orderIds = INJECTED_ORDERS[fix.productName] || [];
    console.log(`  ${fix.productName}:`);
    console.log(`    ❌ Associé à : ${fix.wrongCode} (${wrongProd ? wrongProd.name : 'INTROUVABLE'})`);
    console.log(`    ✅ Devrait être : ${fix.rightCode} (${rightProd ? rightProd.name : 'INTROUVABLE'})`);
    console.log(`    📋 Commandes concernées : ${orderIds.join(', ') || 'aucune'}`);
    console.log('');
    
    if (!rightProd) {
      console.log(`    ⚠️ ATTENTION: le produit ${fix.rightCode} n'existe pas dans la base !`);
    }
  }

  console.log('========================================');
  console.log('  Les corrections doivent être faites');
  console.log('  directement en SQL sur Supabase.');
  console.log('  Voici les requêtes à exécuter :');
  console.log('========================================\n');

  // Générer les requêtes SQL
  for (const fix of FIXES) {
    const orderIds = INJECTED_ORDERS[fix.productName] || [];
    if (orderIds.length === 0) continue;

    const rightProd = productsByCode[fix.rightCode];
    if (!rightProd) {
      console.log(`-- ⚠️ SKIP ${fix.productName}: produit ${fix.rightCode} introuvable\n`);
      continue;
    }

    console.log(`-- Corriger "${fix.productName}" : ${fix.wrongCode} → ${fix.rightCode}`);
    console.log(`UPDATE orders`);
    console.log(`SET "productId" = (SELECT id FROM products WHERE code = '${fix.rightCode}' AND "companyId" = 1 LIMIT 1),`);
    console.log(`    "produitNom" = '${rightProd.name}'`);
    console.log(`WHERE id IN (${orderIds.join(', ')})`);
    console.log(`  AND "companyId" = 1;`);
    console.log('');
  }
}

main().catch(e => { console.error('Erreur:', e); process.exit(1); });
