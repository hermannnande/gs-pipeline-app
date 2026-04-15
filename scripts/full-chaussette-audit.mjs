const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  return (await res.json()).token;
}

const token = await login();

// Fetch ALL orders (not just today)
const res = await fetch(`${API_URL}/orders?limit=1000&sort=desc`, {
  headers: { 'Authorization': 'Bearer ' + token },
});
const data = await res.json();
const all = data.orders || data;

// All chaussette related orders (both product codes)
const chaussette = all.filter(o =>
  o.sourceCampagne === 'CHAUSSETTE_COMPRESSION_LONG' ||
  o.sourceCampagne === 'CHAUSSETTE_DE_COMPRESSION' ||
  o.produitNom?.toLowerCase().includes('chaussette')
);

const today = '2026-04-15';
const todayAll = chaussette.filter(o => o.createdAt?.startsWith(today));
const todayLong = todayAll.filter(o => o.sourceCampagne === 'CHAUSSETTE_COMPRESSION_LONG');
const todayComp = todayAll.filter(o => o.sourceCampagne === 'CHAUSSETTE_DE_COMPRESSION');

console.log('=== AUDIT CHAUSSETTE - 15 avril 2026 ===\n');
console.log(`Facebook Ads : 35 achats web`);
console.log(`Base de donnees (CHAUSSETTE_COMPRESSION_LONG) : ${todayLong.length}`);
console.log(`Base de donnees (CHAUSSETTE_DE_COMPRESSION)   : ${todayComp.length}`);
console.log(`Total chaussette en BDD                       : ${todayAll.length}`);
console.log(`ECART (commandes perdues)                     : ${35 - todayAll.length}\n`);

console.log('--- Toutes les commandes chaussette aujourd\'hui ---');
for (const o of todayAll.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
  const time = new Date(o.createdAt).toLocaleTimeString('fr-FR');
  console.log(`  ${time} | #${o.id} | ${o.sourceCampagne} | ${o.clientNom} | ${o.quantite}x ${o.montant} FCFA | ${o.status}`);
}

// Timeline analysis - when were orders coming in regularly, and when did they stop
console.log('\n--- Analyse temporelle ---');
const sorted = todayAll.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

if (sorted.length > 0) {
  const first = new Date(sorted[0].createdAt);
  const last = new Date(sorted[sorted.length - 1].createdAt);
  const hours = (last - first) / 3600000;
  const rate = sorted.length / hours;
  console.log(`  Premiere commande : ${first.toLocaleTimeString('fr-FR')}`);
  console.log(`  Derniere commande : ${last.toLocaleTimeString('fr-FR')}`);
  console.log(`  Duree active      : ${hours.toFixed(1)}h`);
  console.log(`  Rythme moyen      : ${rate.toFixed(1)} commandes/heure`);

  // Split morning vs afternoon
  const morning = sorted.filter(o => new Date(o.createdAt).getHours() < 12);
  const afternoon = sorted.filter(o => new Date(o.createdAt).getHours() >= 12);
  console.log(`  Matin (avant 12h) : ${morning.length} commandes`);
  console.log(`  Apres-midi (12h+) : ${afternoon.length} commandes`);
}

// Check orders after 12:19 (last chaussette order)
const allAfter1219 = all.filter(o => {
  if (!o.createdAt?.startsWith(today)) return false;
  const h = new Date(o.createdAt).getHours();
  const m = new Date(o.createdAt).getMinutes();
  return (h > 12) || (h === 12 && m > 19);
});
console.log(`\n--- Commandes TOUS PRODUITS apres 12h19 (quand chaussette s'arrete) ---`);
console.log(`  ${allAfter1219.length} commandes apres 12h19 (autres produits continuent)`);
for (const o of allAfter1219.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
  const time = new Date(o.createdAt).toLocaleTimeString('fr-FR');
  const isChaussette = o.produitNom?.toLowerCase().includes('chaussette');
  console.log(`  ${time} | ${o.produitNom} | ${o.status}${isChaussette ? ' *** CHAUSSETTE' : ''}`);
}
