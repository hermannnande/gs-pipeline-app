const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT = {
  code: 'BANDES_BUCCALES_SOMMEIL',
  nom: 'BANDES BUCCALES POUR LE SOMMEIL (PAQUET DE 30)',
  description: 'Paquet de 30 bandes buccales (mouth tape) pour le sommeil : adhesif doux hypoallergenique, favorise la respiration nasale la nuit, aide a reduire le ronflement et la bouche seche. Page bandes-buccales-sommeil.',
  prixUnitaire: 9900,
  prix2Unites: 18900,
  prix3Unites: 26900,
  stockActuel: 50,
  stockAlerte: 10,
};

const login = async () => {
  const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
  return (await res.json()).token;
};

const token = await login();
const list = await fetch(`${API_URL}/products?search=BANDES`, { headers: { Authorization: `Bearer ${token}` } });
const { products = [] } = await list.json();
const existing = products.find((x) => x.code?.toUpperCase() === PRODUCT.code);

if (existing) {
  console.log(`Deja existant (id=${existing.id}) — rien a faire.`);
} else {
  const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(PRODUCT) });
  if (!res.ok) throw new Error(`POST echoue (${res.status}) : ${await res.text()}`);
  const data = await res.json();
  console.log('Produit cree :', JSON.stringify(data.product || data));
}

const pub = await fetch(`${API_URL}/public/products?company=ci`);
const pubData = await pub.json();
const found = (pubData.products || []).find((x) => x.code === PRODUCT.code);
console.log(found ? `Verification publique : OK — ${found.nom} (id=${found.id})` : 'Verification publique : ECHEC');
process.exit(found ? 0 : 1);
