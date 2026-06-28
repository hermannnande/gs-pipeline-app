/**
 * Remet prixUnitaire / prix2Unites / prix3Unites à 9900 / 16900 / 24900
 * sur TOUS les produits actifs de l'API.
 *
 * Usage : node scripts/reset-all-api-prices.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const NEW_PRICES = { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 };
/** Offre SMS soindemoi.net/anti-age — ne pas toucher */
const SKIP_CODES = new Set(['SERUM_CERNE_SMS']);

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
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

const products = await loadProducts(token);
let ok = true;

for (const p of products) {
  if (!p.actif) continue;
  const code = p.code?.toUpperCase() || '?';
  if (SKIP_CODES.has(code)) {
    console.log(`${code} (id=${p.id}) — ignoré (offre anti-age SMS)`);
    continue;
  }
  console.log(`${code} (id=${p.id}) — avant:`, {
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

  const verif = (await loadProducts(token)).find((x) => x.id === p.id);
  const match = [9900, 16900, 24900].every(
    (v, i) => Number([verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i]) === v,
  );
  console.log(`${code} — apres:`, {
    prixUnitaire: verif.prixUnitaire,
    prix2Unites: verif.prix2Unites,
    prix3Unites: verif.prix3Unites,
  }, match ? '✓' : '✗');
  if (!match) ok = false;
}

console.log(ok ? '\nTous les produits actifs : 9900 / 16900 / 24900.' : '\nATTENTION : erreurs detectees.');
process.exit(ok ? 0 : 1);
