/**
 * Crée (ou met à jour) le produit CREME_ECZEMA + template slug creme-eczema
 *
 * Prix : 7 500 / 12 100 / 17 700 FCFA (qty 1/2/3).
 * Usage : node scripts/seed-creme-eczema.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SLUG = 'creme-eczema';
const CODE = 'CREME_ECZEMA';
const NOM = 'Crème Anti-Eczéma';
const PRICES = { prixUnitaire: 7500, prix2Unites: 12100, prix3Unites: 17700 };

const CONFIG = {
  productCode: CODE,
  templateVersion: 1,
  title: 'Crème Anti-Eczéma',
  thankYouUrl: `/${SLUG}/merci`,
  prices: { 1: 7500, 2: 12100, 3: 17700 },
};

let TOKEN = '';
async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${path} -> ${res.status} : ${typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json)}`);
  return json;
}

const loginRes = await fetch(`${API_URL}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!loginRes.ok) throw new Error(`Login ${loginRes.status}`);
TOKEN = (await loginRes.json()).token;
console.log('Login OK');

const { products = [] } = await api(`/products?search=${CODE}`);
let product = products.find((p) => p.code?.toUpperCase() === CODE);

if (product) {
  console.log(`Produit existant id=${product.id}, mise à jour…`);
  await api(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...PRICES, nom: NOM, actif: true }) });
} else {
  console.log('Création produit…');
  const created = await api('/products', {
    method: 'POST',
    body: JSON.stringify({
      code: CODE, nom: NOM,
      description: 'Crème apaisante contre l\'eczéma, les irritations et les démangeaisons.',
      ...PRICES, stockActuel: 100, stockAlerte: 10, imageUrl: null,
    }),
  });
  product = created.product;
  console.log(`Produit créé id=${product.id}`);
}

const after = await api(`/products?search=${CODE}`);
product = (after.products || []).find((p) => p.code?.toUpperCase() === CODE);
console.log('Produit :', { id: product?.id, code: product?.code, ...PRICES });

let existingTpl = null;
try {
  const pub = await fetch(`${API_URL}/templates/public/${SLUG}`);
  if (pub.ok) existingTpl = (await pub.json()).template;
} catch { /* noop */ }

const tplBody = {
  nom: NOM, slug: SLUG,
  description: 'Landing crème anti-eczéma — obrille.com',
  productCode: CODE, productId: product.id, config: JSON.stringify(CONFIG), assetsFolder: null, actif: true,
};

if (existingTpl) {
  console.log(`Template slug=${SLUG} existe (id=${existingTpl.id}), mise à jour…`);
  await api(`/templates/${existingTpl.id}`, { method: 'PUT', body: JSON.stringify(tplBody) });
} else {
  console.log(`Création template slug=${SLUG}…`);
  const tpl = await api('/templates', { method: 'POST', body: JSON.stringify(tplBody) });
  console.log(`Template créé id=${tpl.template?.id}`);
}

const verify = await fetch(`${API_URL}/templates/public/${SLUG}`);
if (!verify.ok) throw new Error(`Vérification publique échouée : ${verify.status}`);
const v = await verify.json();
console.log('\n✓ Mapping confirmé :', { slug: v.template.slug, productCode: v.template.productCode, productId: v.template.productId });
console.log(`\nURL : https://obrille.com/${SLUG}/`);
