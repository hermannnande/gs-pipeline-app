/**
 * Met a jour les prix SERUM_CERNE_SMS via l'API admin.
 * Usage : node scripts/update-serum-cerne-sms-prices.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CODE = 'SERUM_CERNE_SMS';
const PRICES = { prixUnitaire: 6500, prix2Unites: 12000, prix3Unites: 15000 };

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
  const data = await res.json();
  if (!data.token) throw new Error('Token absent');
  return data.token;
}

async function loadProducts(token) {
  const res = await fetch(`${API_URL}/products?limit=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products (${res.status})`);
  return (await res.json()).products || [];
}

async function main() {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const products = await loadProducts(token);
  let p = products.find((x) => x.code?.toUpperCase() === CODE);

  if (!p) {
    const source = products.find((x) => x.code?.toUpperCase() === 'SERUM_CERNE');
    const create = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: CODE,
        nom: 'Serum Anti-Cernes Premium (SMS)',
        description: source?.description || 'Serum anti-cernes — offre SMS prospects.',
        ...PRICES,
        stockActuel: 0,
        stockExpress: 0,
        actif: true,
      }),
    });
    if (!create.ok) {
      const err = await create.text();
      throw new Error(`Creation ${CODE} echouee (${create.status}): ${err}`);
    }
    p = await create.json();
    console.log(`Cree ${CODE} id=${p.id}`);
  } else {
    const patch = await fetch(`${API_URL}/products/${p.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...PRICES, actif: true }),
    });
    if (!patch.ok) throw new Error(`Update ${CODE} (${patch.status}): ${await patch.text()}`);
    console.log(`Mis a jour ${CODE} id=${p.id}`);
  }

  console.log(`Prix : ${PRICES.prixUnitaire} / ${PRICES.prix2Unites} / ${PRICES.prix3Unites} F`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
