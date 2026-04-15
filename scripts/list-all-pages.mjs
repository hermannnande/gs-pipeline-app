const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  return (await res.json()).token;
}

const token = await login();
const res = await fetch(`${API_URL}/templates`, {
  headers: { 'Authorization': 'Bearer ' + token },
});
const data = await res.json();
const templates = data.templates || data;

console.log(`=== ${templates.length} pages produit ===\n`);
for (const t of templates) {
  const cfg = JSON.parse(t.config || '{}');
  const pixel = cfg.metaPixelId || '-';
  const version = cfg.templateVersion || 1;
  console.log(`  ${t.slug}`);
  console.log(`    Landing : https://www.obgestion.com/landing/${t.slug}`);
  console.log(`    Merci   : https://www.obgestion.com/landing/${t.slug}/merci`);
  console.log(`    Produit : ${cfg.productCode || '-'} | V${version} | Pixel: ${pixel}`);
  console.log('');
}
