const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  const data = await res.json();
  return data.token;
}

const token = await login();

// Fetch all orders from today
const today = new Date().toISOString().split('T')[0];
const res = await fetch(`${API_URL}/orders?startDate=${today}&limit=200&sort=desc`, {
  headers: { 'Authorization': 'Bearer ' + token },
});
const data = await res.json();
const orders = data.orders || data;

if (!Array.isArray(orders)) {
  console.log('Format inattendu:', JSON.stringify(data).slice(0, 300));
  process.exit(1);
}

console.log(`=== Commandes du ${today} : ${orders.length} total ===\n`);

// Group by hour
const byHour = {};
for (const o of orders) {
  const h = new Date(o.createdAt).getHours();
  const key = `${String(h).padStart(2, '0')}h`;
  if (!byHour[key]) byHour[key] = [];
  byHour[key].push(o);
}

console.log('--- Repartition par heure ---');
for (const [hour, list] of Object.entries(byHour).sort()) {
  console.log(`  ${hour} : ${list.length} commandes`);
}

console.log('\n--- Chronologie detaillee ---');
for (const o of orders.reverse()) {
  const time = new Date(o.createdAt).toLocaleTimeString('fr-FR');
  const isTest = o.clientNom?.includes('TEST');
  const flag = isTest ? ' [TEST]' : '';
  console.log(`  ${time} | #${o.id} | ${o.clientNom} | ${o.produitNom} | ${o.quantite}x ${o.montant} FCFA | ${o.status}${flag}`);
}

// Check for gaps > 30 minutes between real orders
const realOrders = orders.filter(o => !o.clientNom?.includes('TEST')).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
console.log('\n--- Gaps > 30min entre commandes reelles ---');
let gapFound = false;
for (let i = 1; i < realOrders.length; i++) {
  const prev = new Date(realOrders[i - 1].createdAt);
  const curr = new Date(realOrders[i].createdAt);
  const diffMin = (curr - prev) / 60000;
  if (diffMin > 30) {
    gapFound = true;
    console.log(`  GAP de ${Math.round(diffMin)} min : ${prev.toLocaleTimeString('fr-FR')} -> ${curr.toLocaleTimeString('fr-FR')}`);
  }
}
if (!gapFound) console.log('  Aucun gap significatif detecte.');
