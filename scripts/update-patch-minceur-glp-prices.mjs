/**
 * Met a jour les prix PATCH_MINCEUR_GLP (slug patch-minceur-glp).
 * 1 paquet = 7 000 F | 2 paquets = 12 900 F | 3 paquets = 16 000 F
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PRODUCT_CODE = 'PATCH_MINCEUR_GLP';
const NEW_PRICES = { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 16000 };

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
  const data = await res.json();
  if (!data.token) throw new Error('Token absent');
  return data.token;
}

async function findProduct(token) {
  const res = await fetch(`${API_URL}/products?search=PATCH_MINCEUR`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { products = [] } = await res.json();
  const p = products.find((x) => x.code?.toUpperCase() === PRODUCT_CODE);
  if (!p) throw new Error(`${PRODUCT_CODE} introuvable`);
  return p;
}

const token = await login();
const product = await findProduct(token);
console.log(`Produit : ${product.nom} (${product.code})`);
console.log('Anciens prix :', { prixUnitaire: product.prixUnitaire, prix2Unites: product.prix2Unites, prix3Unites: product.prix3Unites });

const upd = await fetch(`${API_URL}/products/${product.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(NEW_PRICES),
});
if (!upd.ok) throw new Error(`PUT echoue : ${await upd.text()}`);

const verif = await findProduct(token);
console.log('Nouveaux prix :', { prixUnitaire: verif.prixUnitaire, prix2Unites: verif.prix2Unites, prix3Unites: verif.prix3Unites });
const ok = [7000, 12900, 16000].every((v, i) => [verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i] == v);
console.log(ok ? 'Verification : OK' : 'Verification : ECHEC');
process.exit(ok ? 0 : 1);
