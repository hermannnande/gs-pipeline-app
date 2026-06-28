/**
 * Crée (ou met à jour) le produit SPRAY_LIPOME_PROMO + le template slug
 * spraylipome-promo (page SMS dédiée, clone de spraylipome).
 *
 * Prix promo SMS : 7 500 / 14 000 / 20 000 FCFA (qty 1/2/3).
 * Le produit est distinct de SRAY_LIPOME pour ISOLER les commandes du lien SMS.
 *
 * Usage : node scripts/seed-spraylipome-promo.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SLUG = 'spraylipome-promo';
const CODE = 'SPRAY_LIPOME_PROMO';
const SOURCE_CODE = 'SRAY_LIPOME';
const NOM = 'Spray Anti-Lipome (Promo SMS)';
const PRICES = { prixUnitaire: 7500, prix2Unites: 14000, prix3Unites: 20000 };

const CONFIG = {
  productCode: CODE,
  templateVersion: 1,
  title: 'Spray Anti-Lipome',
  thankYouUrl: `/${SLUG}/merci`,
  prices: { 1: 7500, 2: 14000, 3: 20000 },
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
if (!loginRes.ok) throw new Error(`Login ${loginRes.status}`);
TOKEN = (await loginRes.json()).token;
console.log('Login OK');

// ── Produit source (pour copier description/image) ──
const { products: srcList = [] } = await api(`/products?search=${SOURCE_CODE}`);
const source = srcList.find((p) => p.code?.toUpperCase() === SOURCE_CODE);

// ── Produit promo ──
const { products = [] } = await api(`/products?search=${CODE}`);
let product = products.find((p) => p.code?.toUpperCase() === CODE);

if (product) {
  console.log(`Produit existant id=${product.id}, mise à jour prix…`);
  await api(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...PRICES, nom: NOM, actif: true }) });
} else {
  console.log('Création produit…');
  const created = await api('/products', {
    method: 'POST',
    body: JSON.stringify({
      code: CODE,
      nom: NOM,
      description: source?.description || 'Spray anti-lipome — offre SMS ciblée (paiement à la livraison).',
      ...PRICES,
      stockActuel: 100,
      stockAlerte: source?.stockAlerte || 10,
      imageUrl: source?.imageUrl || null,
    }),
  });
  product = created.product;
  console.log(`Produit créé id=${product.id}`);
}

const after = await api(`/products?search=${CODE}`);
product = (after.products || []).find((p) => p.code?.toUpperCase() === CODE);
console.log('Produit :', { id: product?.id, code: product?.code, ...PRICES });

// ── Template (mapping slug) ──
let existingTpl = null;
try {
  const pub = await fetch(`${API_URL}/templates/public/${SLUG}`);
  if (pub.ok) existingTpl = (await pub.json()).template;
} catch { /* noop */ }

const tplBody = {
  nom: NOM,
  slug: SLUG,
  description: 'Landing SMS spray anti-lipome (clone spraylipome, promo 30 min)',
  productCode: CODE,
  productId: product.id,
  config: JSON.stringify(CONFIG),
  assetsFolder: null,
  actif: true,
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
console.log('\n✓ Mapping confirmé :');
console.log(`  slug        : ${v.template.slug}`);
console.log(`  productCode : ${v.template.productCode}`);
console.log(`  productId   : ${v.template.productId}`);
console.log(`  actif       : ${v.template.actif}`);
console.log(`\nURL : https://obrille.com/${SLUG}/`);
