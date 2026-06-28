const slugs = [
  'creme-anti-verrue', 'creme-verrue-tk', 'creme-verrue-tk2', 'spraydouleurtk',
  'creme-ongle-incarne', 'creme-ongle-incarne-v2', 'bande-sport-minceur', 'detoxminceur',
  'patch-minceur-glp', 'chaussette', 'chaussette-compression', 'chaussette-compression-v2',
  'patchdouleurtk', 'patchdouleurfb', 'crememinceurfb', 'spraylipome', 'spraylipometk',
  'creme-anti-lipome', 'creme-anti-lipome-tk', 'chaussette-homme', 'chaussette-premium-homme',
  'creme-anti-cerne', 'serum-cerne', 'serum-cerne-tk', 'serum-cerne-paye',
  'coffret-boxer-homme', 'coffret-boxer-luxe-v3', 'poudre-pousse-cheveux',
  'spray-vitiligo', 'chapeau-gavroche', 'chapeau-dame', 'lunette-de-nuit', 'boutique',
];

const hosts = ['coachingexpertci.com', 'obrille.com'];

for (const host of hosts) {
  console.log(`\n=== ${host} ===`);
  for (const slug of slugs) {
    const url = `https://${host}/${slug}`;
    try {
      const r = await fetch(url, { redirect: 'follow' });
      const html = await r.text();
      const react = html.includes('id="root"');
      const bundle = (html.match(/index-[A-Za-z0-9_-]+\.js/) || [])[0] || 'none';
      const flag = react ? (r.status === 200 ? 'OK' : `HTTP-${r.status}`) : 'NO-REACT';
      if (flag !== 'OK') console.log(`${flag.padEnd(10)} ${slug} bundle=${bundle}`);
    } catch (e) {
      console.log(`ERR        ${slug} ${e.message}`);
    }
  }
}
