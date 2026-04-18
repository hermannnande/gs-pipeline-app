// scripts/remove-verrue-review-imgs.mjs
// Supprime les photos des avis (le composant masque la zone image si img absent)
// Usage: node scripts/remove-verrue-review-imgs.mjs

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUG = 'creme-verrue-tk';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) {
    console.error('Login failed:', res.status, await res.text());
    process.exit(1);
  }
  return (await res.json()).token;
}

async function run() {
  console.log('Fetching current config...');
  const tplRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const data = await tplRes.json();
  const id = data.template.id;
  const cfg = JSON.parse(data.template.config);
  console.log(`  Template ID: ${id}, ${cfg.reviews?.length || 0} reviews`);

  if (!Array.isArray(cfg.reviews)) {
    console.log('  No reviews to update');
    return;
  }

  cfg.reviews.forEach((r) => {
    delete r.img;
  });

  console.log('Logging in...');
  const token = await login();

  console.log('PUT template...');
  const putRes = await fetch(`${API_URL}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  if (!putRes.ok) {
    console.error('Update failed:', putRes.status, await putRes.text());
    process.exit(1);
  }
  console.log('  OK');

  console.log('Verifying...');
  const verifyRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const v = JSON.parse((await verifyRes.json()).template.config);
  v.reviews?.forEach((r, i) => {
    console.log(`   ${i} ${r.n} (${r.v}) — img:`, r.img ?? '(none)');
  });
  console.log('\nDONE. Visit: https://obrille.com/creme-verrue-tk');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
