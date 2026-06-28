/**
 * Vérifie toutes les landings : HTTP 200 + shell React + pas de redirect cassé.
 */
const slugs = [
  'creme-anti-verrue', 'creme-verrue-tk', 'creme-verrue-tk2', 'spraydouleurtk',
  'creme-ongle-incarne', 'creme-ongle-incarne-v2', 'bande-sport-minceur', 'detoxminceur',
  'patch-minceur-glp', 'chaussette', 'chaussette-compression', 'chaussette-compression-v2',
  'patchdouleurtk', 'patchdouleurfb', 'crememinceurfb', 'spraylipome', 'spraylipometk',
  'creme-anti-lipome', 'creme-anti-lipome-tk', 'chaussette-homme', 'chaussette-premium-homme',
  'creme-anti-cerne', 'serum-cerne', 'serum-cerne-tk', 'serum-cerne-paye', 'anti-age',
  'coffret-boxer-homme', 'coffret-boxer-luxe-v3', 'poudre-pousse-cheveux',
  'spray-vitiligo', 'chapeau-gavroche', 'chapeau-dame', 'lunette-de-nuit', 'boutique',
];

const hosts = process.argv.slice(2).length ? process.argv.slice(2) : ['coachingexpertci.com', 'obrille.com', 'soindemoi.net'];

const results = [];
for (const host of hosts) {
  for (const slug of slugs) {
    const url = `https://${host}/${slug}`;
    try {
      const r = await fetch(url, { redirect: 'follow' });
      const html = await r.text();
      const react = html.includes('id="root"');
      const bundle = (html.match(/index-[A-Za-z0-9_-]+\.js/) || [])[0] || 'none';
      const redirected = r.url !== url;
      results.push({
        host,
        slug,
        status: r.status,
        react,
        bundle,
        redirected,
        finalUrl: r.url,
        ok: react && r.status === 200,
      });
    } catch (e) {
      results.push({ host, slug, status: 'ERR', react: false, ok: false, err: e.message });
    }
  }
}

const ok = results.filter((x) => x.ok);
const fail = results.filter((x) => !x.ok);
const redirects = results.filter((x) => x.redirected && x.ok);

console.log(`\n=== Résultat (${results.length} URLs) ===`);
console.log(`OK: ${ok.length} | Échecs: ${fail.length} | Redirects (OK): ${redirects.length}`);
console.log(`Bundles: ${[...new Set(results.map((r) => r.bundle).filter(Boolean))].join(', ')}\n`);

for (const host of hosts) {
  const hostOk = ok.filter((r) => r.host === host).length;
  console.log(`${host}: ${hostOk}/${slugs.length} OK`);
}

if (fail.length) {
  console.log('\n--- ÉCHECS ---');
  for (const f of fail) {
    console.log(`  ${f.host}/${f.slug} → status=${f.status} react=${f.react}${f.err ? ` err=${f.err}` : ''}`);
  }
}

if (redirects.length) {
  console.log('\n--- REDIRECTS (200 + React) ---');
  for (const r of redirects) {
    console.log(`  ${r.slug}: ${r.finalUrl}`);
  }
}

// Pages merci
console.log('\n=== Pages /merci ===');
let merciOk = 0;
let merciFail = 0;
for (const host of hosts) {
  for (const slug of slugs) {
    const url = `https://${host}/${slug}/merci`;
    try {
      const r = await fetch(url, { redirect: 'follow' });
      const html = await r.text();
      const good = r.status === 200 && html.includes('id="root"');
      if (good) merciOk++;
      else {
        merciFail++;
        console.log(`  FAIL ${host}/${slug}/merci status=${r.status}`);
      }
    } catch (e) {
      merciFail++;
      console.log(`  ERR ${host}/${slug}/merci ${e.message}`);
    }
  }
}
console.log(`Merci: ${merciOk}/${slugs.length * hosts.length} OK${merciFail ? ` | ${merciFail} échecs` : ''}`);

process.exit(fail.length || merciFail ? 1 : 0);
