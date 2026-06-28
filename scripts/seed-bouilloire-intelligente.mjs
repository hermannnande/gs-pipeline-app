/**
 * Crée (ou met à jour) le produit BOUILLOIRE_INTELLIGENTE + mapping slug
 * bouilloire-intelligente dans landing_templates (gestion produit obgestion).
 *
 * Prix promo : 8 500 / 16 000 / 21 000 FCFA (qty 1/2/3).
 * Usage : node scripts/seed-bouilloire-intelligente.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SLUG = 'bouilloire-intelligente';
const CODE = 'BOUILLOIRE_INTELLIGENTE';
const NOM = 'Bouilloire Électrique Intelligente';
const PRICES = { prixUnitaire: 8500, prix2Unites: 16000, prix3Unites: 21000 };

const CONFIG = {
  productCode: CODE,
  templateVersion: 1,
  title: NOM,
  subtitle: 'Température réglable 40°C – 100°C',
  thankYouUrl: `/${SLUG}/merci`,
  metaPixelId: '1333239138939400',
  prices: { 1: 8500, 2: 16000, 3: 21000 },
  badge: 'NOUVEAU',
  images: {
    hero: 'https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-26-juin-2026-17_52_46.png',
  },
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

// ── Produit ──
const { products = [] } = await api('/products?search=BOUILLOIRE');
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
      description: 'Bouilloire électrique intelligente à température réglable (40–100°C). Chauffe rapide, arrêt automatique, inox premium.',
      ...PRICES,
      stockActuel: 100,
      stockAlerte: 10,
    }),
  });
  product = created.product;
  console.log(`Produit créé id=${product.id}`);
}

const afterProducts = await api('/products?search=BOUILLOIRE');
product = (afterProducts.products || []).find((p) => p.code?.toUpperCase() === CODE);
console.log('Produit :', { id: product?.id, code: product?.code, ...PRICES });

// ── Landing template (mapping slug) ──
let existingTpl = null;
try {
  const pub = await fetch(`${API_URL}/templates/public/${SLUG}`);
  if (pub.ok) existingTpl = (await pub.json()).template;
} catch { /* noop */ }

if (existingTpl) {
  console.log(`Template slug=${SLUG} existe (id=${existingTpl.id}), mise à jour…`);
  await api(`/templates/${existingTpl.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nom: NOM,
      slug: SLUG,
      description: 'Landing premium bouilloire intelligente — température réglable',
      productCode: CODE,
      productId: product.id,
      config: JSON.stringify(CONFIG),
      assetsFolder: null,
      actif: true,
    }),
  });
} else {
  console.log(`Création template slug=${SLUG}…`);
  const tpl = await api('/templates', {
    method: 'POST',
    body: JSON.stringify({
      nom: NOM,
      slug: SLUG,
      description: 'Landing premium bouilloire intelligente — température réglable',
      productCode: CODE,
      productId: product.id,
      config: JSON.stringify(CONFIG),
      assetsFolder: null,
      actif: true,
    }),
  });
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
