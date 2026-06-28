/**
 * Cree (ou met a jour) le produit CHAUSSETTE_HOMME_MODLE2 pour la landing
 * "Chaussettes Premium Homme" (slug chaussette-premium-homme).
 *
 * Prix : 5 paires 9900 / 10 paires 16900 / 15 paires 24900 (qty 1/2/3).
 * Usage : node scripts/create-chaussette-premium-product.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const CODE = 'CHAUSSETTE_HOMME_MODLE2';
const NOM = 'Chaussettes Premium Homme';
const PRICES = { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 };

let TOKEN = '';
async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${path} -> ${res.status} : ${typeof json === 'string' ? json.slice(0, 200) : JSON.stringify(json)}`);
  return json;
}

const login = await (async () => {
  const r = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (!r.ok) throw new Error(`Login ${r.status}`);
  return (await r.json()).token;
})();
TOKEN = login;
console.log('Login OK');

const { products = [] } = await api('/products?search=CHAUSSETTE');
const existing = products.find((p) => p.code?.toUpperCase() === CODE);

if (existing) {
  console.log(`Produit deja present (id=${existing.id}). Mise a jour des prix...`);
  await api(`/products/${existing.id}`, { method: 'PUT', body: JSON.stringify(PRICES) });
  console.log('Prix mis a jour.');
} else {
  console.log('Produit absent. Creation...');
  const r = await api('/products', {
    method: 'POST',
    body: JSON.stringify({ code: CODE, nom: NOM, description: 'Collection 5 modeles de chaussettes premium homme.', ...PRICES, stockActuel: 100, stockAlerte: 10 }),
  });
  console.log(`Produit cree : id=${r.product?.id}, code=${r.product?.code}`);
}

// Verification
const after = await api('/products?search=CHAUSSETTE');
const p = (after.products || []).find((x) => x.code?.toUpperCase() === CODE);
console.log('Verification :', p ? { id: p.id, code: p.code, nom: p.nom, prixUnitaire: p.prixUnitaire, prix2Unites: p.prix2Unites, prix3Unites: p.prix3Unites, actif: p.actif } : 'INTROUVABLE');
