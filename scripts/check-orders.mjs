const LOGIN_URL = 'https://gs-pipeline-app-2.vercel.app/api/auth/login';
const ORDERS_URL = 'https://gs-pipeline-app-2.vercel.app/api/orders';

const login = await fetch(LOGIN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' })
});
const loginData = await login.json();
if (!loginData.token) { console.error('Login failed:', loginData); process.exit(1); }

const orders = await fetch(ORDERS_URL + '?limit=20&sort=desc', {
  headers: { 'Authorization': 'Bearer ' + loginData.token }
});
const data = await orders.json();
const orderList = data.orders || data;

if (Array.isArray(orderList)) {
  console.log(`=== ${orderList.length} dernières commandes ===\n`);
  for (const o of orderList) {
    const date = o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : 'N/A';
    console.log(`#${o.id} | ${date} | ${o.clientNom} | ${o.clientTelephone} | ${o.produitNom} | ${o.quantite}x | ${o.montant} FCFA | ${o.status} | Source: ${o.sourceCampagne || 'N/A'}`);
  }
} else {
  console.log('Format inattendu:', JSON.stringify(data).substring(0, 500));
}
