const url = 'https://gs-pipeline-app-2.vercel.app/api/public/products?company=ci';

for (const origin of ['https://www.obgestion.com', 'https://obgestion.com']) {
  console.log(`\n--- Origin: ${origin} ---`);
  const r = await fetch(url, { headers: { 'Origin': origin } });
  console.log('Status:', r.status);
  console.log('Access-Control-Allow-Origin:', r.headers.get('access-control-allow-origin'));
  console.log('Vary:', r.headers.get('vary'));
  
  // Also test preflight
  const pre = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  console.log('Preflight Status:', pre.status);
  console.log('Preflight ACAO:', pre.headers.get('access-control-allow-origin'));
}
