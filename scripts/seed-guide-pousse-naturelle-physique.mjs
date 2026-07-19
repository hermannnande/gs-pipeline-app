/**
 * Crée (ou met à jour) le produit GUIDE_POUSSE_NATURELLE_PHYSIQUE dans obgestion.
 *
 * Version IMPRIMÉE du guide « Faire pousser vos cheveux naturellement », vendue
 * en paiement à la livraison — contrairement à l'ebook GUIDE_POUSSE_NATURELLE
 * (digital, payé via Chariow, produit isolé hors pipeline).
 *
 * Ce code n'est PAS dans utils/isolatedProducts.js (ISOLATED_PRODUCT_CODES ne
 * contient que 'GUIDE_POUSSE_NATURELLE', comparé en égalité stricte) : ses
 * commandes suivent donc le pipeline standard — page "À appeler", validation,
 * tournée de livraison — exactement comme les crèmes et les chaussettes.
 *
 * Prix 9 900 F contre 8 900 F pour l'ebook : couvre l'impression et la livraison.
 *
 * ⚠️ stockActuel est initialisé à 100. Ajustez-le dans l'admin selon le nombre
 * d'exemplaires réellement imprimés, sinon les alertes de stock seront fausses.
 *
 * Usage : node scripts/seed-guide-pousse-naturelle-physique.mjs
 *   Variables d'env optionnelles : API_URL, ADMIN_EMAIL, ADMIN_PASSWORD
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const CODE = 'GUIDE_POUSSE_NATURELLE_PHYSIQUE';
const NOM = 'Guide Pousse Naturelle (Livre imprimé)';
const DESCRIPTION =
  'Version imprimée du guide « Faire pousser vos cheveux naturellement ». Livrée à domicile, paiement à la livraison.';
// Commandes toujours en quantité 1 côté landing, mais on renseigne les paliers
// 2/3 au cas où un appelant augmenterait la quantité depuis obgestion.
const PRICES = { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 };
const STOCK_INITIAL = 100;

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
  console.log(`Produit existant id=${product.id}, mise à jour des prix…`);
  await api(`/products/${product.id}`, {
    method: 'PUT',
    // On ne touche PAS au stock d'un produit existant : il reflète l'inventaire réel.
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
      stockActuel: STOCK_INITIAL,
      stockAlerte: 10,
      imageUrl: null,
    }),
  });
  product = created.product;
  console.log(`Produit créé id=${product.id} (stock initial ${STOCK_INITIAL} — à ajuster dans l'admin)`);
}

const after = await api(`/products?search=${CODE}`);
const final = (after.products || []).find((p) => p.code?.toUpperCase() === CODE);
console.log('Produit final :', JSON.stringify(final, null, 2));
console.log('\n✅ Terminé. Les commandes du livre imprimé arriveront dans la page "À appeler".');
