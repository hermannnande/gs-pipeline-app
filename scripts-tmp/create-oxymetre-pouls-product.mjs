/**
 * Cree le produit MINI_SAC_BANDOULIERE en base (via l'API admin).
 * Requis par useOrderSubmit : la commande echoue tant que le code
 * produit n'est pas resolvable via /api/public/products?company=ci.
 *
 * Prix : 1 = 9 900 F · 2 = 16 900 F · 3 = 24 900 F
 * Usage : node scripts-tmp/create-mini-sac-product.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT = {
  code: 'OXYMETRE_POULS',
  nom: 'MINI SAC BANDOULIERE TACTILE',
  description: 'Mini sac bandouliere avec fenetre tactile telephone + portefeuille integre. Coloris disponible : Marron.',
  prixUnitaire: 8500,
  prix2Unites: 15900,
  prix3Unites: 22900,
  stockActuel: 50,
  stockAlerte: 10,
};

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

const token = await login();
console.log('Login OK');

// Verifie si le produit existe deja
const list = await fetch(`${API_URL}/products?search=OXYMETRE_SAC`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!list.ok) throw new Error(`GET /products echoue (${list.status})`);
const { products = [] } = await list.json();
const existing = products.find((x) => x.code?.toUpperCase() === PRODUCT.code);

if (existing) {
  console.log(`Produit deja existant (id=${existing.id}) — mise a jour des prix...`);
  const upd = await fetch(`${API_URL}/products/${existing.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      prixUnitaire: PRODUCT.prixUnitaire,
      prix2Unites: PRODUCT.prix2Unites,
      prix3Unites: PRODUCT.prix3Unites,
    }),
  });
  if (!upd.ok) throw new Error(`PUT echoue (${upd.status}) : ${await upd.text()}`);
  console.log('Prix mis a jour.');
} else {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(PRODUCT),
  });
  if (!res.ok) throw new Error(`POST /products echoue (${res.status}) : ${await res.text()}`);
  const data = await res.json();
  console.log('Produit cree :', JSON.stringify(data.product || data, null, 2));
}

// Verification publique (ce que voit la landing)
const pub = await fetch(`${API_URL}/public/products?company=ci`);
const pubData = await pub.json();
const found = (pubData.products || []).find((x) => x.code === PRODUCT.code);
console.log(found
  ? `\nVerification publique : OK — ${found.nom} (id=${found.id}) ${found.prixUnitaire}/${found.prix2Unites}/${found.prix3Unites} F`
  : '\nVerification publique : ECHEC — produit toujours invisible !');
process.exit(found ? 0 : 1);
