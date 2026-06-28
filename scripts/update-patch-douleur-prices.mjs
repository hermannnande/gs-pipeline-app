/**
 * Met a jour les prix PATCH_DOULEUR_TK et PATCH_DOULEUR_FB en base.
 *
 * Prix promo :
 *   1 boite  = 7 000 F
 *   2 boites = 12 000 F
 *   3 boites = 15 000 F *
 * Usage : node scripts/update-patch-douleur-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const NEW_PRICES = { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 };
const CODES = ['PATCH_DOULEUR_TK', 'PATCH_DOULEUR_FB'];

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status}) : ${await res.text()}`);
  const data = await res.json();
  if (!data.token) throw new Error('Token absent');
  return data.token;
}

async function loadProducts(token) {
  const res = await fetch(`${API_URL}/products?limit=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /products echoue (${res.status})`);
  return (await res.json()).products || [];
}

const token = await login();
console.log('Login OK\n');

let all = await loadProducts(token);
let ok = true;

for (const code of CODES) {
  const p = all.find((x) => x.code?.toUpperCase() === code);
  if (!p) {
    console.error(`✗ ${code} introuvable`);
    ok = false;
    continue;
  }
  console.log(`${code} (id=${p.id}) — avant :`, {
    prixUnitaire: p.prixUnitaire,
    prix2Unites: p.prix2Unites,
    prix3Unites: p.prix3Unites,
  });

  const upd = await fetch(`${API_URL}/products/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(NEW_PRICES),
  });
  if (!upd.ok) {
    console.error(`✗ PUT ${code} : ${await upd.text()}`);
    ok = false;
    continue;
  }

  all = await loadProducts(token);
  const verif = all.find((x) => x.code?.toUpperCase() === code);
  const match = [7000, 12000, 15000].every(
    (v, i) => Number([verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i]) === v,
  );
  console.log(`${code} — apres :`, {
    prixUnitaire: verif.prixUnitaire,
    prix2Unites: verif.prix2Unites,
    prix3Unites: verif.prix3Unites,
  }, match ? '✓' : '✗');
  if (!match) ok = false;
}

console.log(ok ? '\nTous les prix conformes.' : '\nATTENTION : erreurs detectees.');
process.exit(ok ? 0 : 1);
