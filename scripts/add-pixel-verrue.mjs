const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const PIXEL_ID = '1607715340249349';
const SLUG = 'creme-verrue-tk';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) { console.error('Login failed:', res.status, await res.text()); process.exit(1); }
  return (await res.json()).token;
}

async function run() {
  console.log('Logging in...');
  const token = await login();
  console.log('OK\n');

  const listRes = await fetch(`${API_URL}/templates`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { templates } = await listRes.json();

  const tpl = templates.find(t => t.slug === SLUG);
  if (!tpl) { console.error(`Template "${SLUG}" introuvable`); process.exit(1); }

  const cfg = JSON.parse(tpl.config);
  cfg.metaPixelId = PIXEL_ID;

  const putRes = await fetch(`${API_URL}/templates/${tpl.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });

  if (putRes.ok) {
    console.log(`[OK] "${SLUG}" -> metaPixelId = ${PIXEL_ID}`);
  } else {
    console.error(`[ERREUR]:`, putRes.status, await putRes.text());
  }
}

run().catch(e => { console.error(e); process.exit(1); });
