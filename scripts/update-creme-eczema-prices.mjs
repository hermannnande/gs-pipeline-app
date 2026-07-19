/**
 * Met a jour les prix du produit CREME_ECZEMA (landing creme-eczema).
 *   1 tube  =  9 500 F
 *   2 tubes = 16 100 F
 *   3 tubes = 23 700 F
 *
 * Ancien tarif : 7 500 / 12 100 / 17 700 F. Les remises pack sont conservees
 * (2 900 F sur le pack 2, 4 800 F sur le pack 3), donc les libelles de la
 * landing restent valables.
 *
 * A garder synchronise avec les prix codes en dur cote frontend :
 *   - pages/public/CremeEczemaLanding.tsx   (PRICES, OLD_UNIT, libelles)
 *   - pages/public/CremeEczemaThankYou.tsx  (PRICES)
 * Le backend facture depuis le produit (computePublicOrderTotal dans
 * routes/public.routes.js), pas depuis le payload client : un ecart
 * base/landing ferait payer un montant different de celui affiche.
 *
 * Les commandes deja passees ne bougent pas : leur montant est fige a la
 * creation sur la ligne de commande.
 *
 * Usage : node scripts/update-creme-eczema-prices.mjs
 */

const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT_CODE = 'CREME_ECZEMA';
const SLUG = 'creme-eczema';
const NEW_PRICES = { prixUnitaire: 9500, prix2Unites: 16100, prix3Unites: 23700 };

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
  const res = await fetch(`${API_URL}/products?search=${PRODUCT_CODE}`, {
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

// ─── Template ──────────────────────────────────────────────────────────────
// La landing est du React avec ses prix en dur : ce template ne pilote ni
// l'affichage ni la facturation. On l'aligne quand meme pour ne pas laisser
// deux verites sur le meme produit.
const TPL_PRICES = { '1': 9500, '2': 16100, '3': 23700 };
const tplRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
const tplData = await tplRes.json();

if (!tplData.template) {
  console.log(`\nTemplate ${SLUG} : absent, rien a faire.`);
} else {
  const cfg = JSON.parse(tplData.template.config);
  console.log(`\nTemplate ${SLUG} (id=${tplData.template.id})`);
  console.log('  Anciens prix :', JSON.stringify(cfg.prices));

  cfg.prices = TPL_PRICES;
  for (const opt of cfg.qtyOptions || []) {
    if (TPL_PRICES[String(opt.qty)]) opt.price = TPL_PRICES[String(opt.qty)];
  }
  for (const b of cfg.bundles || []) {
    if (TPL_PRICES[String(b.qty)]) b.price = TPL_PRICES[String(b.qty)];
  }

  const tplUpd = await fetch(`${API_URL}/templates/${tplData.template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  if (!tplUpd.ok) throw new Error(`PUT /templates echoue (${tplUpd.status}) : ${await tplUpd.text()}`);

  const v = await (await fetch(`${API_URL}/templates/public/${SLUG}`)).json();
  console.log('  Nouveaux prix :', JSON.stringify(JSON.parse(v.template.config).prices));
}

process.exit(ok ? 0 : 1);
