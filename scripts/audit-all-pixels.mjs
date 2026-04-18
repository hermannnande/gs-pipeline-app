const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

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

  const listRes = await fetch(`${API_URL}/templates`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { templates } = await listRes.json();

  console.log(`\n=== ${templates.length} templates trouves ===\n`);

  const byPixel = new Map();
  const noPixel = [];

  for (const t of templates) {
    let cfg = {};
    try { cfg = JSON.parse(t.config); } catch {}
    const pid = cfg.metaPixelId;
    if (!pid) {
      noPixel.push(t);
      continue;
    }
    if (!byPixel.has(pid)) byPixel.set(pid, []);
    byPixel.get(pid).push(t);
  }

  console.log('+-----------------------------------------------------------+');
  console.log('| AUDIT DES PIXELS PAR TEMPLATE                             |');
  console.log('+-----------------------------------------------------------+\n');

  // Templates SANS pixel
  if (noPixel.length > 0) {
    console.log(`[!] TEMPLATES SANS PIXEL (${noPixel.length}):`);
    for (const t of noPixel) {
      console.log(`    - ${t.slug.padEnd(30)} | ${t.actif ? 'ACTIF' : 'inactif'} | "${t.nom}"`);
    }
    console.log('');
  }

  // Templates AVEC pixel groupes par pixelId
  console.log(`Templates AVEC pixel: ${templates.length - noPixel.length}\n`);

  const pixelDiagnostics = [];

  for (const [pid, tpls] of byPixel.entries()) {
    console.log(`Pixel: ${pid}`);
    console.log(`  Utilise par ${tpls.length} template(s):`);
    for (const t of tpls) {
      console.log(`    - ${t.slug.padEnd(30)} | ${t.actif ? 'ACTIF' : 'inactif'} | "${t.nom}"`);
    }

    // Verifier le token CAPI
    const checkRes = await fetch(`${API_URL}/analytics/meta-config?pixelId=${pid}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      const status = data.hasToken ? '[OK]' : '[!!]';
      console.log(`  ${status} Token CAPI: ${data.hasToken ? 'CONFIGURE (' + data.tokenSource + ')' : 'MANQUANT'}`);
      pixelDiagnostics.push({ pixelId: pid, hasToken: data.hasToken, templates: tpls.map(t => t.slug) });
    } else {
      console.log(`  [?] Verification impossible (status ${checkRes.status})`);
      pixelDiagnostics.push({ pixelId: pid, hasToken: null, templates: tpls.map(t => t.slug) });
    }
    console.log('');
  }

  // Resume final
  console.log('+-----------------------------------------------------------+');
  console.log('| RESUME                                                    |');
  console.log('+-----------------------------------------------------------+');
  console.log(`Total templates                    : ${templates.length}`);
  console.log(`Templates avec pixel               : ${templates.length - noPixel.length}`);
  console.log(`Templates SANS pixel               : ${noPixel.length}`);
  console.log(`Pixels uniques utilises            : ${byPixel.size}`);
  const tokensMissing = pixelDiagnostics.filter(d => d.hasToken === false);
  console.log(`Pixels SANS token CAPI             : ${tokensMissing.length}`);
  if (tokensMissing.length > 0) {
    console.log(`\n[ACTION REQUISE] Les pixels suivants n'ont PAS de token CAPI:`);
    for (const d of tokensMissing) {
      console.log(`  ${d.pixelId} (templates: ${d.templates.join(', ')})`);
    }
    console.log(`\nAjoutez sur Vercel la variable META_PIXEL_TOKENS au format:`);
    console.log(`  pixelId1:token1,pixelId2:token2,...`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
