// Test via le proxy (comme le ferait le navigateur)
const proxyUrl = 'https://www.obgestion.com/api/public/order';

console.log('=== Test commande via www.obgestion.com (proxy) ===');
const r = await fetch(proxyUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 102,
    customerName: 'TEST VERIFICATION CHAUSSETTE',
    customerPhone: '0000000000',
    customerCity: 'Test',
    quantity: 1
  })
});
const data = await r.json();
console.log('Status:', r.status);
console.log('Result:', JSON.stringify(data));

// Cleanup
if (data.success) {
  const API = 'https://gs-pipeline-app-2.vercel.app/api';
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  const { token } = await login.json();
  const orders = await fetch(`${API}/orders?limit=5&sort=desc`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const od = await orders.json();
  const test = (od.orders || od).find(o => o.clientNom === 'TEST VERIFICATION CHAUSSETTE');
  if (test) {
    await fetch(`${API}/orders/${test.id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    console.log('Test order #' + test.id + ' supprimee.');
  }
}
