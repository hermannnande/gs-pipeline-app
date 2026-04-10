// Injection des commandes manquantes du 30-31 mars 2026 via l'API webhook en production

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api/webhook/make';
const API_KEY = '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf';

function fixPhone(raw) {
  let p = String(raw).replace(/\s+/g, '').trim();
  if (p.startsWith('+225')) return p;
  if (p.startsWith('225') && p.length >= 12) return '+' + p;
  p = p.replace(/^\+/, '');
  // Numéros ivoiriens à 9 chiffres → ajouter le 0 devant
  if (/^\d{9}$/.test(p)) p = '0' + p;
  return p;
}

const PRODUCT_MAPPING = {
  'chaussette de compression': 'CHAUSSETTE_CHAUFFANTE',
  'patch minceur glp': 'PATCH_MINCEUR',
  'creme minceur': 'SPRAY_MINCEUR',
  'patch anti douleur': 'SPRAY_DOULEUR',
  'creme anti cerne': 'CREME_ANTI_CERNE',
  'Crème Anti-Verrues': 'CREME_ANTI_VERRUES',
  'Creme anti lipome': 'CREME_ANTI_LIPOME',
  'gaine tourmaline chauffante': 'GAINE_MINCEUR_TOURMALINE_CHAUFFANTE',
  'POUDRE_CHEVEUX': 'POUDRE_CHEVEUX',
  'pourdre pousse cheveux': 'POUDRE_CHEVEUX',
  'SERUM_ONGLE': 'SERUM_ONGLE',
  'spray anti douleur': 'SPRAY_DOULEUR',
};

const ORDERS = [
  // 30/03/2026
  { produit: 'chaussette de compression', ville: 'Yamoussoukro', tel: '504828283', nom: 'Edwige zogbo', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Abidjan treichville', tel: '586755774', nom: 'Miezan Evelyne', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'creme anti cerne', ville: 'Yopougon micao', tel: '747507377', nom: 'Kouadio Anicet', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'creme minceur', ville: 'Abidjan - Angre', tel: '+2250708370608', nom: 'KONAN', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'Crème Anti-Verrues', ville: 'Soubré', tel: '+2250757496503', nom: 'Guéhi zadi arnaud', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'Creme anti lipome', ville: 'Yamoussokro', tel: '747377405', nom: 'Konate Mamadou', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'creme minceur', ville: 'Marcory zone 4', tel: '708756072', nom: 'Franck', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Port bouet', tel: '708022230', nom: 'Fatoumata Sanogo', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Biakouma', tel: '707653345', nom: 'Sadia Sahi', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'creme minceur', ville: 'Abobo', tel: '778786794', nom: 'Diakite Mory', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'creme minceur', ville: 'Divo', tel: '504309035', nom: 'Alain Zouma', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'POUDRE_CHEVEUX', ville: 'San Pedro', tel: '+2250702189438', nom: 'Bogbe Tia daniel', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Boufle', tel: '143623442', nom: 'Abigail maciva', qte: 2, prix: 16900, date: '2026-03-30' },
  { produit: 'patch anti douleur', ville: 'Abidjan Port-bouet aéroport', tel: '707311317', nom: 'Omer Kaoh', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Koumassi', tel: '709493371', nom: 'Kinda Hamidou', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'chaussette de compression', ville: 'Dabou', tel: '505577171', nom: 'Guefala Yeo', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'POUDRE_CHEVEUX', ville: 'Abidjan Adjame', tel: '778926805', nom: 'Melo Melo', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'Creme anti lipome', ville: 'Hma', tel: '707892548', nom: 'Sanogo', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'Creme anti lipome', ville: 'Riviera palmeraie', tel: '711247533', nom: 'Djedje thierry', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'patch minceur glp', ville: 'Bondoukou/ Hamdallah', tel: '748403341', nom: 'Drissa sore', qte: 1, prix: 9900, date: '2026-03-30' },
  { produit: 'gaine tourmaline chauffante', ville: 'Bonon', tel: '798164147', nom: 'Roseline Aya', qte: 1, prix: 9900, date: '2026-03-30' },
  // 31/03/2026
  { produit: 'creme anti cerne', ville: 'Soubré', tel: '758653402', nom: 'Kouassi Kognon Celestin', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Yopougon rond point de gesco', tel: '709534383', nom: 'Bienvenue', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Deux plateaux', tel: '709110833', nom: 'Sabine Natacha Bahouan', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'San pedro', tel: '+2250171162399', nom: 'Gbato Onene Marie Pierre', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan-Cocody-Angré', tel: '707990091', nom: 'Mobio Kacou Hermann Stéphane', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'ISSIA', tel: '709001399', nom: 'OUREGA CHRIST MAHEVA-MARCELLE ÉPOUSE ZEBIYOU', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Yamoussoukro (Ebenezer)', tel: '707010319', nom: 'Bohoussou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'POUDRE_CHEVEUX', ville: 'abobo mosquée petro ivoire', tel: '+2250546003918', nom: 'sidibe Fanta madi', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Bouaké', tel: '707218275', nom: 'Soro Lydie', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'POUDRE_CHEVEUX', ville: 'Abidjan -port-bouet', tel: '101885909', nom: 'Abou Ouattara Kouma', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Bayota', tel: '788957030', nom: 'DOUYERE TRAZIE', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan/ Yopougon, feux tricolores Sapeurs pompiers', tel: '707207216', nom: 'Edouard LEVRY', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Duekoue', tel: '565123800', nom: 'Yaya Traore', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Guiglo', tel: '749235096', nom: 'Valentin Compaoré', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Abidjan -Macory', tel: '788163111', nom: 'BODJÉ Marie -Estelle', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Anani ancienne route de Bassam face phcie Léana', tel: '707508975', nom: 'Ogoubiyi Ganiyou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Abidjan Yopougon niangon nord lubafrique', tel: '141525141', nom: 'Familles Youan', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'patch anti douleur', ville: 'Abidjan yopougon', tel: '707356646', nom: 'Toure', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Sassandra', tel: '505044585', nom: 'Justice Yapi', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Citè sir nouveau goudron', tel: '789843550', nom: "Céline N'gouan", qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'chaussette de compression', ville: 'Oume', tel: '778540319', nom: 'Yolande kouakou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: "Abidjan - Plateau en face de l'hôtel ibis", tel: '757024410', nom: 'Jean-Philippe', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Korhogo', tel: '+2250710778533', nom: 'Kalifa soro', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Abidjan', tel: '506967986', nom: 'Oliver', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Korhogo (Ali Kader)', tel: '+2250709451042', nom: 'Philippe ABBE', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Abidjan Yopougon', tel: '706468536', nom: "Claude N'guessan", qte: 2, prix: 16900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Bonoua', tel: '+2250768335146', nom: 'Joel Vangah', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Agnibilekro', tel: '584553394', nom: 'Tokpa diomande joel', qte: 2, prix: 16900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Yopougon carrefour basiboli', tel: '747968029', nom: 'Ouattara marie', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Cocody Djorogobité cité Sir', tel: '707534497', nom: 'Kouassi', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Abobo adjame', tel: '707435581', nom: 'Traoré Moussa', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme minceur', ville: 'Zoukougbeu', tel: '748787252', nom: 'Mr PAO sylvestre', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'patch anti douleur', ville: 'Yopougon Ananerais', tel: '708265672', nom: 'Kouakou Marc', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'POUDRE_CHEVEUX', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan -port-bouet', tel: '101885909', nom: 'Abou Ouattara Kouma', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'abobo mosquée petro ivoire', tel: '+2250546003918', nom: 'sidibe Fanta madi', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan Adjame', tel: '778926805', nom: 'Melo Melo', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'sanpedro', tel: '702189438', nom: 'sanpédro', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'spray anti douleur', ville: 'Abidjan', tel: '778030075', nom: 'hermann nande', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme anti cerne', ville: 'Abidjan ,yopougon', tel: '707184956', nom: 'Gbayoro', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Abidjan Koumassi', tel: '708385936', nom: 'Ballo Aboubacar', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Bingerville lauriers 20', tel: '+2250709190183', nom: 'Pauline', qte: 3, prix: 24900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan yopougon', tel: '704325339', nom: 'ozoua rita sorokobi', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'chaussette de compression', ville: 'Soubré', tel: '707253336', nom: 'Gnapi boaly Mathieu', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Bondoukou', tel: '594363309', nom: "N'cho Sidoine Descate ASSI", qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan Yopougon', tel: '759196240', nom: 'Kouzssi linfa', qte: 2, prix: 16900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Man', tel: '798596979', nom: 'Gonkanou Charles', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan -Bingerville', tel: '707539222', nom: 'Fidèle ETCHE', qte: 2, prix: 16900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Nouveau goudron Cocody', tel: '777411563', nom: 'Mme sylla', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Abidjan - Plateau', tel: '708806549', nom: 'NIMBA PAUL', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Galèbre', tel: '709111779', nom: 'Theo Bouda', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Yamissokro', tel: '151710776', nom: 'Honoré kouakou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Abidjan Yopougon', tel: '+2250707948111', nom: 'Konan Paul Aboh', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'gaine tourmaline chauffante', ville: 'Agboville aboussouan transport ou sbta transport', tel: '+2250101531564', nom: 'Komenan yaha Nadège', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Yopougon', tel: '140402352', nom: 'Attihoua Kouame Nicodème', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme anti cerne', ville: 'Yopouguon', tel: '+2250749358996', nom: 'Oulaï osée Omer', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'Cocody', tel: '151788178', nom: 'Tiantai', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme anti cerne', ville: 'Abidjan Cocody Angre Château', tel: '758333364', nom: 'Don Gabriel', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Crème Anti-Verrues', ville: 'Fresco', tel: '594862176', nom: 'Avit', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme anti cerne', ville: 'Abidjan koumassi', tel: '709557726', nom: 'Erik Kambire', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'spray anti douleur', ville: 'issia', tel: '170561015', nom: 'Zazou eugène', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Boundiali', tel: '103348491', nom: 'Kone', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'creme minceur', ville: 'Divo', tel: '566580568', nom: 'Kouakou ahoutou David', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'Ndotré', tel: '556626945', nom: 'Mory', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'pourdre pousse cheveux', ville: 'DALOA', tel: '709344381', nom: 'Kouassi kouame prince', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'Creme anti lipome', ville: 'Danané', tel: '708218971', nom: 'Armel Bolou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'patch anti douleur', ville: 'Abidjan Riviera Ciad', tel: '709770941', nom: 'Sountoura Amadou', qte: 1, prix: 9900, date: '2026-03-31' },
  { produit: 'SERUM_ONGLE', ville: 'A man', tel: '788402371', nom: 'Adamo diarra', qte: 1, prix: 9900, date: '2026-03-31' },
];

async function sendOrder(order) {
  const phone = fixPhone(order.tel);
  const productCode = PRODUCT_MAPPING[order.produit] || PRODUCT_MAPPING[order.produit.toLowerCase()] || order.produit;

  const payload = {
    product_key: productCode,
    customer_name: order.nom,
    customer_phone: phone,
    customer_city: order.ville,
    quantity: order.qte,
    source: 'INJECTION_MANUELLE_30-31_MARS',
    make_scenario_name: 'script-inject-missing',
    raw_payload: { total: String(order.prix), original_date: order.date },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { status: res.status, data, phone, productCode };
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  Injection de ${ORDERS.length} commandes manquantes`);
  console.log(`  30-31 mars 2026 → API production`);
  console.log(`========================================\n`);

  let created = 0;
  let errors = 0;
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < ORDERS.length; i++) {
    const o = ORDERS[i];
    try {
      const result = await sendOrder(o);
      if (result.status === 200 || result.status === 201) {
        const method = result.data.match_method || '?';
        console.log(`  ✅ [${i + 1}/${ORDERS.length}] ${o.nom} | ${result.phone} | ${o.produit} → ${result.productCode} (${method}) | #${result.data.order_id}`);
        created++;
      } else {
        console.log(`  ❌ [${i + 1}/${ORDERS.length}] ${o.nom} | ${result.phone} | ${o.produit} → ERREUR ${result.status}: ${JSON.stringify(result.data)}`);
        errors++;
      }
    } catch (err) {
      console.log(`  ❌ [${i + 1}/${ORDERS.length}] ${o.nom} | ERREUR RESEAU: ${err.message}`);
      errors++;
    }
    // Petit délai pour ne pas surcharger l'API
    await delay(200);
  }

  console.log(`\n========================================`);
  console.log(`  RESULTAT :`);
  console.log(`    ✅ Créées : ${created}`);
  console.log(`    ❌ Erreurs : ${errors}`);
  console.log(`    Total : ${ORDERS.length}`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error('Erreur fatale:', e); process.exit(1); });
