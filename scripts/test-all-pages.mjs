const SLUGS = [
  'creme-ongle-incarne',
  'creme-verrue-tk',
  'crememinceurfb',
  'chaussette-compression',
  'spraydouleurtk',
  'patchdouleurtk',
  'creme-anti-verrue',
];

console.log('=== Test acces pages produit ===\n');

for (const slug of SLUGS) {
  // Test landing page
  const landing = await fetch(`https://www.obgestion.com/landing/${slug}`);
  const landingHtml = await landing.text();
  const hasRoot = landingHtml.includes('id="root"');

  // Test thank you page
  const merci = await fetch(`https://www.obgestion.com/landing/${slug}/merci?company=ci&ref=test`);

  // Test API template
  const api = await fetch(`https://www.obgestion.com/api/templates/public/${slug}`);
  const apiData = await api.json();
  const tplOk = !!apiData.template;

  // Test product match
  let prodOk = false;
  if (tplOk) {
    const cfg = JSON.parse(apiData.template.config);
    const prods = await fetch(`https://www.obgestion.com/api/public/products`);
    const prodsData = await prods.json();
    const match = prodsData.products.find(p => p.code?.toUpperCase() === cfg.productCode?.toUpperCase());
    prodOk = !!match;
  }

  const status = (landing.status === 200 && hasRoot && merci.status === 200 && tplOk && prodOk) ? '✅' : '❌';
  console.log(`${status} ${slug}`);
  console.log(`   Landing: ${landing.status} | Merci: ${merci.status} | Template: ${tplOk ? 'OK' : 'FAIL'} | Produit: ${prodOk ? 'OK' : 'FAIL'}`);
}

// Test order submission for each
console.log('\n=== Test commandes ===\n');
const prods = await fetch('https://www.obgestion.com/api/public/products');
const prodsData = await prods.json();

const loginRes = await fetch('https://gs-pipeline-app-2.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
});
const { token } = await loginRes.json();

for (const slug of SLUGS) {
  const api = await fetch(`https://www.obgestion.com/api/templates/public/${slug}`);
  const apiData = await api.json();
  const cfg = JSON.parse(apiData.template.config);
  const prod = prodsData.products.find(p => p.code?.toUpperCase() === cfg.productCode?.toUpperCase());

  if (!prod) { console.log(`❌ ${slug} — produit introuvable`); continue; }

  const order = await fetch('https://www.obgestion.com/api/public/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: prod.id,
      customerName: 'TEST_ACCESS',
      customerPhone: '0000000000',
      customerCity: 'Test',
      quantity: 1,
    }),
  });
  const orderData = await order.json();
  console.log(`${order.status === 201 ? '✅' : '❌'} ${slug} — commande: ${order.status}`);

  // Cleanup
  if (orderData.success) {
    const orders = await fetch('https://gs-pipeline-app-2.vercel.app/api/orders?limit=3&sort=desc', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const od = await orders.json();
    const test = (od.orders || od).find(o => o.clientNom === 'TEST_ACCESS');
    if (test) await fetch(`https://gs-pipeline-app-2.vercel.app/api/orders/${test.id}`, {
      method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token },
    });
  }
}
