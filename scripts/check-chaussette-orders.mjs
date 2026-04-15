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

const res = await fetch(`${API_URL}/orders?limit=500&sort=desc`, {
  headers: { 'Authorization': 'Bearer ' + token },
});
const data = await res.json();
const all = data.orders || data;

const chaussette = all.filter(o =>
  o.sourceCampagne === 'CHAUSSETTE_COMPRESSION_LONG' ||
  o.produitNom?.toLowerCase().includes('chaussette compression long')
);

console.log(`=== Commandes "chaussette compression long" ===`);
console.log(`Total trouvees : ${chaussette.length}\n`);

// Par jour
const byDay = {};
for (const o of chaussette) {
  const day = new Date(o.createdAt).toLocaleDateString('fr-FR');
  if (!byDay[day]) byDay[day] = [];
  byDay[day].push(o);
}

console.log('--- Par jour ---');
for (const [day, list] of Object.entries(byDay)) {
  console.log(`  ${day} : ${list.length} commandes`);
}

// Par statut
const byStatus = {};
for (const o of chaussette) {
  byStatus[o.status] = (byStatus[o.status] || 0) + 1;
}
console.log('\n--- Par statut ---');
for (const [s, c] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s} : ${c}`);
}

// Detail aujourd'hui
const today = new Date().toISOString().split('T')[0];
const todayOrders = chaussette.filter(o => o.createdAt?.startsWith(today));
console.log(`\n--- Detail aujourd'hui (${todayOrders.length} commandes) ---`);
for (const o of todayOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
  const time = new Date(o.createdAt).toLocaleTimeString('fr-FR');
  console.log(`  ${time} | #${o.id} | ${o.clientNom} | ${o.clientTelephone} | ${o.quantite}x ${o.montant} FCFA | ${o.status}`);
}

// Gaps > 1h entre commandes chaussette aujourd'hui
console.log('\n--- Gaps > 1h entre commandes chaussette aujourd\'hui ---');
const sorted = todayOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
let gapFound = false;
for (let i = 1; i < sorted.length; i++) {
  const prev = new Date(sorted[i - 1].createdAt);
  const curr = new Date(sorted[i].createdAt);
  const diffMin = (curr - prev) / 60000;
  if (diffMin > 60) {
    gapFound = true;
    console.log(`  GAP ${Math.round(diffMin)} min : ${prev.toLocaleTimeString('fr-FR')} -> ${curr.toLocaleTimeString('fr-FR')}`);
  }
}
if (!gapFound) console.log('  Aucun gap > 1h detecte.');
