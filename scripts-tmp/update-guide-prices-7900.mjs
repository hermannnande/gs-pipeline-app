const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const token = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }) })).json().then(d => d.token);
for (const [code, prix] of [['GUIDE_POUSSE_NATURELLE_PHYSIQUE', 7900], ['GUIDE_POUSSE_NATURELLE', 6900]]) {
  const list = await fetch(`${API_URL}/products?search=${code}`, { headers: { Authorization: `Bearer ${token}` } });
  const { products = [] } = await list.json();
  const p = products.find((x) => x.code === code);
  if (!p) { console.log(code, ': INTROUVABLE'); continue; }
  const res = await fetch(`${API_URL}/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ prixUnitaire: prix, prix2Unites: prix, prix3Unites: prix }) });
  console.log(code, `(id=${p.id})`, res.ok ? `MAJ OK -> ${prix}` : `ERREUR ${res.status}`);
}
