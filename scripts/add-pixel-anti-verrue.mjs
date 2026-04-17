const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const PIXEL_ID = '1639149310623476';
const SLUG = 'creme-anti-verrue';

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
  const before = cfg.metaPixelId || 'NONE';
  console.log(`Avant: metaPixelId = ${before}`);

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
    process.exit(1);
  }

  // Verification de la config CAPI (token)
  console.log('\n=== Verification du token CAPI ===');
  const checkRes = await fetch(`${API_URL}/analytics/meta-config?pixelId=${PIXEL_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (checkRes.ok) {
    const data = await checkRes.json();
    console.log(JSON.stringify(data, null, 2));
    if (!data.hasToken) {
      console.warn(`\n[ATTENTION] Le token CAPI pour le pixel ${PIXEL_ID} n'est PAS configure sur Vercel.`);
      console.warn(`Action requise: ajouter une variable d'environnement sur Vercel:`);
      console.warn(`  META_PIXEL_TOKENS = ${PIXEL_ID}:VOTRE_TOKEN_CAPI`);
      console.warn(`(ou mettre directement META_ACCESS_TOKEN si c'est le pixel principal)`);
    } else {
      console.log(`\n[OK] Token CAPI configure (${data.tokenSource}). Purchase server-side OK.`);
    }
  } else {
    console.error('Endpoint meta-config indisponible (deploy en cours ?):', checkRes.status);
  }

  // Verification finale du template public
  const verifyRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const verifyData = await verifyRes.json();
  const verifyCfg = JSON.parse(verifyData.template.config);
  console.log(`\nVerification publique: metaPixelId = ${verifyCfg.metaPixelId || 'MANQUANT'}`);
}

run().catch(e => { console.error(e); process.exit(1); });
