/**
 * Restaure les prix promo API par produit (état d'avant reset 9900 uniforme).
 * Usage : node scripts/restore-promo-api-prices.mjs
 */
const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCTS = [
  { code: 'CREME_ONGLE_INCARNE', prices: { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 14900 } },
  { code: 'CREME_ANTI_VERRUES', prices: { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 14900 } },
  { code: 'CREME_ANTI_VERRUES2', prices: { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 14900 } },
  { code: 'VERRUE_TK', prices: { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 14900 } },
  { code: 'CHAUSSETTE_CHAUFFANTE', prices: { prixUnitaire: 5000, prix2Unites: 9000, prix3Unites: 12000 } },
  { code: 'PATCH_DETOX_MINCEUR', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CREME_ANTI_CERNE', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'PATCH_DOULEUR_TK', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'PATCH_DOULEUR_FB', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'SERUM_CERNE', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'BANDE_SPORT_MINCEUR', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'PATCH_MINCEUR_GLP', prices: { prixUnitaire: 7000, prix2Unites: 12900, prix3Unites: 16000 } },
  { code: 'CHEAPEAU_DAME', prices: { prixUnitaire: 8000, prix2Unites: 15900, prix3Unites: 21000 } },
  { code: 'CHAUSSETTE_DE_COMPRESSION', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CHAUSSETTE_COMPRESSION_LONG', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CREME_ANTI_LIPOME', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CREME_ANTI_LIPOME_TK', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'SPRAY_DOULEUR', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'SRAY_LIPOME', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'LIPOME_SPRAY_TK', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CREME_MINCEUR', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'POUDRE_CHEVEUX', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'CHAPEAU_GAVROCHE', prices: { prixUnitaire: 7000, prix2Unites: 12000, prix3Unites: 15000 } },
  { code: 'LUNETTE_VISION_NOCTUNE', prices: { prixUnitaire: 8500, prix2Unites: 11000, prix3Unites: 14000 } },
  { code: 'CHAUSSETTE_HOMME', prices: { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 } },
  { code: 'CHAUSSETTE_HOMME_MODLE2', prices: { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 } },
  { code: 'SERUM_CERNE_TK', prices: { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 } },
  { code: 'SERUM_CERNE_PAYE', prices: { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 } },
  { code: 'CREME_VITILIGO', prices: { prixUnitaire: 9900, prix2Unites: 16900, prix3Unites: 24900 } },
];

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

let all = await loadProducts(token);
let ok = true;
let updated = 0;
let missing = 0;

for (const { code, prices } of PRODUCTS) {
  const p = all.find((x) => x.code?.toUpperCase() === code);
  if (!p) {
    console.warn(`⚠ ${code} introuvable — ignoré`);
    missing++;
    continue;
  }

  const upd = await fetch(`${API_URL}/products/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(prices),
  });
  if (!upd.ok) {
    console.error(`✗ PUT ${code} : ${await upd.text()}`);
    ok = false;
    continue;
  }

  all = await loadProducts(token);
  const verif = all.find((x) => x.code?.toUpperCase() === code);
  const match = Object.values(prices).every(
    (v, i) => Number([verif.prixUnitaire, verif.prix2Unites, verif.prix3Unites][i]) === v,
  );
  console.log(`${code} → ${verif.prixUnitaire} / ${verif.prix2Unites} / ${verif.prix3Unites}`, match ? '✓' : '✗');
  if (!match) ok = false;
  updated++;
}

console.log(`\n${updated} produits mis à jour, ${missing} introuvable(s).`);
console.log(ok ? 'Prix API conformes.' : 'ATTENTION : erreurs.');
process.exit(ok ? 0 : 1);
