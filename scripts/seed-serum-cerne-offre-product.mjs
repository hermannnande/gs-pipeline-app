/**
 * Cree (ou met a jour) le produit SERUM_CERNE_OFFRE + template slug serum-cerne-offre.
 * Landing retargeting Meta -20% (7900 / 13900 / 18900 F).
 * Meme pattern que seed-serum-cerne-tiktok-product.mjs.
 *
 * Usage : node scripts/seed-serum-cerne-offre-product.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SLUG = 'serum-cerne-offre';
const CODE = 'SERUM_CERNE_OFFRE';
const SOURCE_CODE = 'SERUM_CERNE';
const NOM = 'Serum Anti-Cernes Premium (Offre -20%)';
const PRICES = { prixUnitaire: 7900, prix2Unites: 13900, prix3Unites: 18900 };

const CONFIG = {
  productCode: CODE,
  templateVersion: 1,
  title: 'Serum Anti-Cernes Premium',
  thankYouUrl: `/${SLUG}/merci`,
  prices: { 1: 7900, 2: 13900, 3: 18900 },
  metaPixelId: '',
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
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status} : ${typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json)}`);
  }
  return json;
}

const loginRes = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!loginRes.ok) throw new Error(`Login ${loginRes.status} : ${await loginRes.text()}`);
TOKEN = (await loginRes.json()).token;
console.log('Login OK');

const { products: srcList = [] } = await api(`/products?search=${SOURCE_CODE}`);
const source = srcList.find((p) => p.code?.toUpperCase() === SOURCE_CODE);

const { products = [] } = await api(`/products?search=${CODE}`);
let product = products.find((p) => p.code?.toUpperCase() === CODE);

if (product) {
  console.log(`Produit existant id=${product.id}, mise a jour…`);
  await api(`/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...PRICES, nom: NOM, actif: true }),
  });
} else {
  console.log('Creation produit…');
  const created = await api('/products', {
    method: 'POST',
    body: JSON.stringify({
      code: CODE,
      nom: NOM,
      description: source?.description || 'Serum dermatologique anti-cernes — retargeting Meta -20%.',
      ...PRICES,
      stockActuel: 100,
      stockAlerte: source?.stockAlerte || 10,
      imageUrl: source?.imageUrl || null,
      actif: true,
    }),
  });
  product = created.product;
  console.log(`Produit cree id=${product.id}`);
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
  nom: NOM,
  slug: SLUG,
  description: 'Landing retargeting Meta -20% — clone serum-cerne-tk (violet nuit / or rose)',
  productCode: CODE,
  productId: product.id,
  config: JSON.stringify(CONFIG),
  assetsFolder: null,
  actif: true,
};

if (existingTpl) {
  console.log(`Template slug=${SLUG} existe (id=${existingTpl.id}), mise a jour…`);
  await api(`/templates/${existingTpl.id}`, { method: 'PUT', body: JSON.stringify(tplBody) });
} else {
  console.log(`Creation template slug=${SLUG}…`);
  const tpl = await api('/templates', { method: 'POST', body: JSON.stringify(tplBody) });
  console.log(`Template cree id=${tpl.template?.id}`);
}

const pub = await fetch(`${API_URL}/public/products`);
if (!pub.ok) throw new Error(`GET /public/products echoue : ${pub.status}`);
const pubList = (await pub.json()).products || [];
const visible = pubList.find((p) => p.code?.toUpperCase() === CODE);
if (!visible) throw new Error(`${CODE} absent de GET /public/products`);

const verifyTpl = await fetch(`${API_URL}/templates/public/${SLUG}`);
if (!verifyTpl.ok) throw new Error(`Verification template echouee : ${verifyTpl.status}`);
const v = await verifyTpl.json();
console.log('\n✓ Template :', { slug: v.template.slug, productCode: v.template.productCode, productId: v.template.productId });
console.log('✓ Produit visible sur l\'API publique');
console.log(`\nURL : https://soindemoi.net/${SLUG}`);
