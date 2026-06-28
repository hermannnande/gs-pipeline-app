/**
 * Met a jour les prix CREME_ANTI_VERRUES2 (slug creme-verrue-tk2).
 *   1 boite = 7 000 F | 2 boites = 12 900 F | 3 boites = 14 900 F
 *
 * Usage : node scripts/update-creme-verrue-tk2-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT_CODE = 'CREME_ANTI_VERRUES2';
const NEW_PRICES = { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 14900 };

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
  if (!res.ok) throw new Error(`GET /products echoue (${res.status})`);
  const { products = [] } = await res.json();
  const p = products.find((x) => x.code?.toUpperCase() === PRODUCT_CODE);
  if (!p) throw new Error(`Produit ${PRODUCT_CODE} introuvable.`);
  return p;
}

const token = await login();
console.log('Login OK');

const product = await findProduct(token);
console.log(`\nProduit : ${product.nom} (id=${product.id})`);
console.log('Anciens prix :', { prixUnitaire: product.prixUnitaire, prix2Unites: product.prix2Unites, prix3Unites: product.prix3Unites });

const upd = await fetch(`${API_URL}/products/${product.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(NEW_PRICES),
});
if (!upd.ok) throw new Error(`PUT echoue (${upd.status}) : ${await upd.text()}`);

const verif = await findProduct(token);
console.log('Nouveaux prix :', { prixUnitaire: verif.prixUnitaire, prix2Unites: verif.prix2Unites, prix3Unites: verif.prix3Unites });
const ok = [7000, 12900, 14900].every((v, i) => [verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i] == v);
console.log(ok ? '\nVerification : prix conformes.' : '\nVerification : ATTENTION.');
process.exit(ok ? 0 : 1);
