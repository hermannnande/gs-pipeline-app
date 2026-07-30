const API_URL = process.env.API_URL || 'https://gs-pipeline-app-2.vercel.app/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gs-pipeline.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const PRODUCT = {
  code: 'AJUSTEUR_CEINTURE_TK',
  nom: 'Ajusteur de Ceinture Élastique — TikTok',
  description: 'Ajusteur de ceinture elastique avec crochets metalliques : resserre instantanement un pantalon trop large a la taille, sans couture ni percage. Canal TikTok (page ajusteur-ceinture-tk).',
  prixUnitaire: 6900,
  prix2Unites: 12900,
  prix3Unites: 16900,
  stockActuel: 50,
  stockAlerte: 10,
};

const login = async () => {
  const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (!res.ok) throw new Error(`Login echoue (${res.status})`);
  return (await res.json()).token;
};

const token = await login();
const list = await fetch(`${API_URL}/products?search=AJUSTEUR`, { headers: { Authorization: `Bearer ${token}` } });
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
