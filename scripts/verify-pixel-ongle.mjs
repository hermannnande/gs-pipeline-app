const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

// 1. Verify template config
const tpl = await fetch(`${API_URL}/templates/public/creme-ongle-incarne`);
const data = await tpl.json();
const cfg = JSON.parse(data.template.config);
console.log('=== Template creme-ongle-incarne ===');
console.log('metaPixelId:', cfg.metaPixelId);
console.log('productCode:', cfg.productCode);
console.log('thankYouUrl:', cfg.thankYouUrl);
console.log('templateVersion:', cfg.templateVersion);

// 2. Verify landing page loads
const page = await fetch('https://www.obgestion.com/landing/creme-ongle-incarne');
console.log('\nLanding page status:', page.status);

// 3. Verify thank you page route
const tyPage = await fetch('https://www.obgestion.com/landing/creme-ongle-incarne/merci?company=ci&ref=test');
console.log('Thank you page status:', tyPage.status);

// 4. Verify product exists
const prods = await fetch(`${API_URL}/public/products`);
const prodsData = await prods.json();
const prod = prodsData.products.find(p => p.code === 'CREME_ONGLE_INCARNE');
console.log('\nProduit:', prod ? `id=${prod.id} nom=${prod.nom} prix=${prod.prixUnitaire}` : 'NON TROUVE');

// 5. Test order flow
if (prod) {
  const order = await fetch('https://www.obgestion.com/api/public/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: prod.id,
      customerName: 'TEST PIXEL ONGLE',
      customerPhone: '0000000000',
      customerCity: 'Test',
      quantity: 1,
      metaPixelId: cfg.metaPixelId,
    })
  });
  const orderData = await order.json();
  console.log('Test order:', order.status, orderData.success ? 'OK' : 'ECHEC');

  // Cleanup
  if (orderData.success) {
    const login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
    });
    const { token } = await login.json();
    const orders = await fetch(`${API_URL}/orders?limit=3&sort=desc`, { headers: { 'Authorization': 'Bearer ' + token } });
    const od = await orders.json();
    const test = (od.orders || od).find(o => o.clientNom === 'TEST PIXEL ONGLE');
    if (test) {
      await fetch(`${API_URL}/orders/${test.id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      console.log('Test order #' + test.id + ' nettoyee.');
    }
  }
}

console.log('\n=== RESUME ===');
console.log('Pixel ID:', cfg.metaPixelId);
console.log('Client-side (PageView, ViewContent, AddToCart, InitiateCheckout): via metaPixelId dans la config');
console.log('Client-side Purchase: sur la page de remerciement via metaPixelId');
console.log('Server-side CAPI Purchase: via META_PIXEL_TOKENS sur le backend');
