/**
 * Crée (ou met à jour) le produit GUIDE_POUSSE_NATURELLE dans obgestion.
 *
 * Produit 100% DIGITAL (ebook « Faire pousser vos cheveux naturellement »).
 * Payé + livré par Chariow (le PDF reste chez Chariow). obgestion ne fait
 * qu'ENREGISTRER la transaction (webhook /api/chariow/webhook).
 *
 * Ce produit est ISOLÉ (utils/isolatedProducts.js : GUIDE_POUSSE_NATURELLE) :
 * ses commandes n'apparaissent pas dans le pipeline "à appeler"/livraison,
 * seulement dans la page admin dédiée (/admin/ventes-digitales).
 *
 * Le webhook résout le produit par son code = SLUG.toUpperCase().replace(/-/g,'_')
 * → GUIDE_POUSSE_NATURELLE. Donc seul le PRODUIT est nécessaire (pas de template).
 *
 * Stock "infini" (999999) car digital : aucune gestion de stock ni d'alerte.
 *
 * Usage : node scripts/seed-guide-pousse-naturelle.mjs
 *   Variables d'env optionnelles : API_URL, ADMIN_EMAIL, ADMIN_PASSWORD
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const CODE = 'GUIDE_POUSSE_NATURELLE';
const NOM = 'Guide Pousse Naturelle (Ebook)';
const DESCRIPTION =
  'Ebook numérique — Faire pousser vos cheveux naturellement. Produit digital : paiement et livraison du PDF gérés par Chariow.';
// Prix unique 4500 F. Les commandes ebook sont toujours en quantité 1.
const PRICES = { prixUnitaire: 4500, prix2Unites: 9000, prix3Unites: 13500 };

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
if (!loginRes.ok) throw new Error(`Login ${loginRes.status} — vérifiez ADMIN_EMAIL / ADMIN_PASSWORD`);
TOKEN = (await loginRes.json()).token;
console.log('Login OK');

const { products = [] } = await api(`/products?search=${CODE}`);
let product = products.find((p) => p.code?.toUpperCase() === CODE);

if (product) {
  console.log(`Produit existant id=${product.id}, mise à jour…`);
  await api(`/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...PRICES, nom: NOM, description: DESCRIPTION, actif: true }),
  });
} else {
  console.log('Création produit…');
  const created = await api('/products', {
    method: 'POST',
    body: JSON.stringify({
      code: CODE,
      nom: NOM,
      description: DESCRIPTION,
      ...PRICES,
      stockActuel: 999999,
      stockAlerte: 0,
      imageUrl: null,
    }),
  });
  product = created.product;
  console.log(`Produit créé id=${product.id}`);
}

const after = await api(`/products?search=${CODE}`);
const final = (after.products || []).find((p) => p.code?.toUpperCase() === CODE);
console.log('Produit final :', JSON.stringify(final, null, 2));
console.log('\n✅ Terminé. Le webhook Chariow liera désormais les ventes ebook à ce produit (isolé).');
