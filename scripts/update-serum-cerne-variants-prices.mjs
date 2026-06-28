/**
 * Met a jour les prix SERUM_CERNE_TK et SERUM_CERNE_PAYE (pages clones serum-cerne).
 *   1 flacon  = 9 900 F | 2 flacons = 16 900 F | 3 flacons = 24 900 F
 *
 * Usage : node scripts/update-serum-cerne-variants-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const NEW_PRICES = { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 };
const CODES = ['SERUM_CERNE_TK', 'SERUM_CERNE_PAYE'];

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

async function findProduct(token, code) {
  const res = await fetch(`${API_URL}/products?search=SERUM`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products echoue (${res.status})`);
  const { products = [] } = await res.json();
  const p = products.find((x) => x.code?.toUpperCase() === code);
  if (!p) throw new Error(`Produit ${code} introuvable.`);
  return p;
}

async function updateProduct(token, code) {
  const product = await findProduct(token, code);
  console.log(`\n${code} (id=${product.id}) — avant :`, {
    prixUnitaire: product.prixUnitaire,
    prix2Unites: product.prix2Unites,
    prix3Unites: product.prix3Unites,
  });

  const upd = await fetch(`${API_URL}/products/${product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(NEW_PRICES),
  });
  if (!upd.ok) throw new Error(`PUT ${code} echoue (${upd.status}) : ${await upd.text()}`);

  const verif = await findProduct(token, code);
  console.log(`${code} — apres :`, {
    prixUnitaire: verif.prixUnitaire,
    prix2Unites: verif.prix2Unites,
    prix3Unites: verif.prix3Unites,
  });

  return [verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites].every(
    (v, i) => Number(v) === [NEW_PRICES.prixUnitaire, NEW_PRICES.prix2Unites, NEW_PRICES.prix3Unites][i],
  );
}

const token = await login();
console.log('Login OK');

let allOk = true;
for (const code of CODES) {
  try {
    const ok = await updateProduct(token, code);
    if (!ok) allOk = false;
  } catch (e) {
    console.error(`Erreur ${code} :`, e.message);
    allOk = false;
  }
}

console.log(allOk ? '\nVerification : tous les prix conformes.' : '\nVerification : ATTENTION.');
process.exit(allOk ? 0 : 1);
