/**
 * Cree (ou met a jour) le produit CHAUSSETTE_DE_COMPRESSION pour la landing
 * "Chaussette de compression V2" (slug chaussette-compression-v2).
 *
 * Prix : 1 paire 7000 / 2 paires 12000 / 3 paires 15000 (qty 1/2/3).
 * Usage : node scripts/create-chaussette-compression-v2-product.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const CODE = 'CHAUSSETTE_DE_COMPRESSION';
const NOM = 'Chaussette de compression';
const PRICES = { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 };

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
    body: JSON.stringify({ code: CODE, nom: NOM, description: 'Chaussette de compression anti-douleur et anti-gonflement des pieds.', ...PRICES, stockActuel: 100, stockAlerte: 10 }),
  });
  console.log(`Produit cree : id=${r.product?.id}, code=${r.product?.code}`);
}

// Verification
const after = await api('/products?search=CHAUSSETTE');
const p = (after.products || []).find((x) => x.code?.toUpperCase() === CODE);
console.log('Verification :', p ? { id: p.id, code: p.code, nom: p.nom, prixUnitaire: p.prixUnitaire, prix2Unites: p.prix2Unites, prix3Unites: p.prix3Unites, actif: p.actif } : 'INTROUVABLE');
