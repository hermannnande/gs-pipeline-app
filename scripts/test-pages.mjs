const pages = [
  'https://www.obgestion.com/landing/creme-verrue-tk',
  'https://www.obgestion.com/landing/chaussette-compression',
  'https://www.obgestion.com/landing/creme-ongle-incarne',
  'https://www.obgestion.com/landing/crememinceurfb',
];

for (const url of pages) {
  try {
    const r = await fetch(url);
    const html = await r.text();
    const hasRoot = html.includes('id="root"');
    console.log(`${url} => Status: ${r.status} | Root: ${hasRoot} | Size: ${html.length}`);
  } catch (e) {
    console.error(`${url} => ERROR: ${e.message}`);
  }
}
