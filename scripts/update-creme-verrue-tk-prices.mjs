/**
 * Met a jour les prix du produit CREME_ANTI_VERRUES (creme-verrue-tk).
 * Aligne sur le pack standard, comme VERRUE_TK et CREME_ANTI_VERRUE_BLEU_TK :
 *   1 boite  =  9 900 F
 *   2 boites = 16 900 F
 *   3 boites = 24 900 F
 *
 * A garder synchronise avec les prix codes en dur cote frontend :
 *   - pages/public/CremeVerrueTkLanding.tsx   (PRICES + libelles QTY_OPTS)
 *   - pages/public/CremeVerrueTkThankYou.tsx  (PRICES_BY_SLUG)
 * Le backend facture depuis le produit (computePublicOrderTotal dans
 * routes/public.routes.js), donc un ecart base/landing ferait payer un
 * montant different de celui affiche.
 *
 * Les commandes deja passees ne bougent pas : leur montant est fige a la
 * creation sur la ligne de commande.
 *
 * Usage : node scripts/update-creme-verrue-tk-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT_CODE = 'CREME_ANTI_VERRUES';
const NEW_PRICES = { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 };

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status}) : ${await res.text()}`);
  const data = await res.json();
  if (!data.token) throw new Error('Token absent de la reponse de login.');
  return data.token;
}

async function findProduct(token) {
  const res = await fetch(`${API_URL}/products?search=VERRUE`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products echoue (${res.status}) : ${await res.text()}`);
  const { products = [] } = await res.json();
  const p = products.find((x) => x.code?.toUpperCase() === PRODUCT_CODE);
  if (!p) {
    const codes = products.map((x) => x.code).join(', ') || '(aucun)';
    throw new Error(`Produit ${PRODUCT_CODE} introuvable. Codes trouves : ${codes}`);
  }
  return p;
}

const token = await login();
console.log('Login OK');

const product = await findProduct(token);
console.log(`\nProduit : ${product.nom} (id=${product.id}, code=${product.code})`);
console.log('Anciens prix :', {
  prixUnitaire: product.prixUnitaire,
  prix2Unites: product.prix2Unites,
  prix3Unites: product.prix3Unites,
});

const upd = await fetch(`${API_URL}/products/${product.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(NEW_PRICES),
});
if (!upd.ok) throw new Error(`PUT /products/${product.id} echoue (${upd.status}) : ${await upd.text()}`);
console.log('\nMise a jour : OK');

const verif = await findProduct(token);
console.log('Nouveaux prix :', {
  prixUnitaire: verif.prixUnitaire,
  prix2Unites: verif.prix2Unites,
  prix3Unites: verif.prix3Unites,
});

const ok =
  Number(verif.prixUnitaire) === NEW_PRICES.prixUnitaire &&
  Number(verif.prix2Unites) === NEW_PRICES.prix2Unites &&
  Number(verif.prix3Unites) === NEW_PRICES.prix3Unites;
console.log(ok ? '\nVerification : prix conformes.' : '\nVerification : ATTENTION, prix non conformes.');
process.exit(ok ? 0 : 1);
