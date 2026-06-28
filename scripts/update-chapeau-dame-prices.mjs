/**
 * Met a jour les prix du produit CHEAPEAU_DAME (slug chapeau-dame).
 *   1 chapeau  = 8 000 F
 *   2 chapeaux = 15 900 F
 *   3 chapeaux = 21 000 F
 *
 * Usage : node scripts/update-chapeau-dame-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT_CODE = 'CHEAPEAU_DAME';
const NEW_PRICES = { prixUnitaire: 8000, prix2Unites: 15900, prix3Unites: 21000 };

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
  const res = await fetch(`${API_URL}/products?search=CHAPEAU`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products echoue (${res.status}) : ${await res.text()}`);
  const { products = [] } = await res.json();
  const p = products.find((x) => x.code?.toUpperCase() === PRODUCT_CODE);
  if (!p) throw new Error(`Produit ${PRODUCT_CODE} introuvable.`);
  return p;
}

const token = await login();
console.log('Login OK');

const product = await findProduct(token);
console.log(`\nProduit : ${product.nom} (id=${product.id}, code=${product.code})`);
console.log('Anciens prix :', { prixUnitaire: product.prixUnitaire, prix2Unites: product.prix2Unites, prix3Unites: product.prix3Unites });

const upd = await fetch(`${API_URL}/products/${product.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(NEW_PRICES),
});
if (!upd.ok) throw new Error(`PUT echoue (${upd.status}) : ${await upd.text()}`);
console.log('Prix mis a jour.');

const verif = await findProduct(token);
const ok = [8000, 15900, 21000].every((v, i) => Number([verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i]) === v);
console.log('Verification :', { prixUnitaire: verif.prixUnitaire, prix2Unites: verif.prix2Unites, prix3Unites: verif.prix3Unites, ok: ok ? 'OK' : 'ERREUR' });
