const tests = [
  'https://www.obgestion.com/api/public/products?company=ci',
  'https://www.obgestion.com/api/templates/public/creme-verrue-tk',
  'https://www.obgestion.com/api/templates/public/chaussette-compression',
];

for (const url of tests) {
  try {
    const r = await fetch(url);
    const data = await r.json();
    const label = url.split('/api/')[1];
    if (data.products) {
      console.log(`${label} => OK (${data.products.length} products)`);
    } else if (data.template) {
      console.log(`${label} => OK (slug: ${data.template.slug})`);
    } else {
      console.log(`${label} => Status ${r.status}`, JSON.stringify(data).slice(0, 100));
    }
  } catch (e) {
    console.error(`${url} => ERROR: ${e.message}`);
  }
}
