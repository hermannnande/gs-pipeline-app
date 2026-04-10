// Réinjection UNIQUEMENT des commandes perdues (produits non reconnus par l'ancien webhook)
// Produits concernés : chaussette de compression, patch minceur glp, creme minceur, patch anti douleur

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api/webhook/make';
const API_KEY = '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf';

function fixPhone(raw) {
  let p = String(raw).replace(/\s+/g, '').trim();
  if (p.startsWith('+225')) return p;
  if (p.startsWith('225') && p.length >= 12) return '+' + p;
  p = p.replace(/^\+/, '');
  if (/^\d{9}$/.test(p)) p = '0' + p;
  return p;
}

const ORDERS = [
  // 30/03/2026 - chaussette de compression
  { produit: 'CHAUSSETTE_DE_COMPRESSION', ville: 'Yamoussoukro', tel: '504828283', nom: 'Edwige zogbo', qte: 1, prix: 9900 },
  { produit: 'CHAUSSETTE_DE_COMPRESSION', ville: 'Dabou', tel: '505577171', nom: 'Guefala Yeo', qte: 1, prix: 9900 },
  // 30/03/2026 - patch minceur glp
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Abidjan treichville', tel: '586755774', nom: 'Miezan Evelyne', qte: 1, prix: 9900 },
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Port bouet', tel: '708022230', nom: 'Fatoumata Sanogo', qte: 1, prix: 9900 },
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Biakouma', tel: '707653345', nom: 'Sadia Sahi', qte: 1, prix: 9900 },
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Boufle', tel: '143623442', nom: 'Abigail maciva', qte: 2, prix: 16900 },
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Koumassi', tel: '709493371', nom: 'Kinda Hamidou', qte: 1, prix: 9900 },
  { produit: 'PATCH_MINCEUR_GLP', ville: 'Bondoukou/ Hamdallah', tel: '748403341', nom: 'Drissa sore', qte: 1, prix: 9900 },
  // 30/03/2026 - creme minceur
  { produit: 'CREME_MINCEUR', ville: 'Abidjan - Angre', tel: '+2250708370608', nom: 'KONAN', qte: 1, prix: 9900 },
  { produit: 'CREME_MINCEUR', ville: 'Marcory zone 4', tel: '708756072', nom: 'Franck', qte: 1, prix: 9900 },
  { produit: 'CREME_MINCEUR', ville: 'Abobo', tel: '778786794', nom: 'Diakite Mory', qte: 1, prix: 9900 },
  { produit: 'CREME_MINCEUR', ville: 'Divo', tel: '504309035', nom: 'Alain Zouma', qte: 1, prix: 9900 },
  // 30/03/2026 - patch anti douleur
  { produit: 'PATCH_ANTI_DOULEUR', ville: 'Abidjan Port-bouet aéroport', tel: '707311317', nom: 'Omer Kaoh', qte: 1, prix: 9900 },
  // 31/03/2026 - chaussette de compression
  { produit: 'CHAUSSETTE_DE_COMPRESSION', ville: 'Oume', tel: '778540319', nom: 'Yolande kouakou', qte: 1, prix: 9900 },
  { produit: 'CHAUSSETTE_DE_COMPRESSION', ville: 'Soubré', tel: '707253336', nom: 'Gnapi boaly Mathieu', qte: 1, prix: 9900 },
  // 31/03/2026 - patch anti douleur
  { produit: 'PATCH_ANTI_DOULEUR', ville: 'Abidjan yopougon', tel: '707356646', nom: 'Toure', qte: 1, prix: 9900 },
  { produit: 'PATCH_ANTI_DOULEUR', ville: 'Yopougon Ananerais', tel: '708265672', nom: 'Kouakou Marc', qte: 1, prix: 9900 },
  { produit: 'PATCH_ANTI_DOULEUR', ville: 'Abidjan Riviera Ciad', tel: '709770941', nom: 'Sountoura Amadou', qte: 1, prix: 9900 },
  // 31/03/2026 - creme minceur
  { produit: 'CREME_MINCEUR', ville: 'Zoukougbeu', tel: '748787252', nom: 'Mr PAO sylvestre', qte: 1, prix: 9900 },
  { produit: 'CREME_MINCEUR', ville: 'Divo', tel: '566580568', nom: 'Kouakou ahoutou David', qte: 1, prix: 9900 },
];

async function sendOrder(order) {
  const phone = fixPhone(order.tel);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY },
    body: JSON.stringify({
      product_key: order.produit,
      customer_name: order.nom,
      customer_phone: phone,
      customer_city: order.ville,
      quantity: order.qte,
      source: 'RECUPERATION_COMMANDES_PERDUES',
      make_scenario_name: order.produit,
    }),
  });
  return { status: res.status, data: await res.json(), phone };
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  Injection des ${ORDERS.length} commandes PERDUES uniquement`);
  console.log(`========================================\n`);

  let ok = 0, err = 0;
  for (let i = 0; i < ORDERS.length; i++) {
    const o = ORDERS[i];
    try {
      const r = await sendOrder(o);
      if (r.status === 200 || r.status === 201) {
        console.log(`  ✅ [${i+1}/${ORDERS.length}] ${o.nom} | ${r.phone} | ${o.produit} | #${r.data.order_id}`);
        ok++;
      } else {
        console.log(`  ❌ [${i+1}/${ORDERS.length}] ${o.nom} | ERREUR ${r.status}: ${JSON.stringify(r.data)}`);
        err++;
      }
    } catch (e) {
      console.log(`  ❌ [${i+1}/${ORDERS.length}] ${o.nom} | ERREUR: ${e.message}`);
      err++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n========================================`);
  console.log(`  ✅ Créées : ${ok}`);
  console.log(`  ❌ Erreurs : ${err}`);
  console.log(`  Total : ${ORDERS.length}`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error('Erreur:', e); process.exit(1); });
