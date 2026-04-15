const urls = [
  'https://www.obgestion.com/api/auth/login',
  'https://obgestion.com/api/auth/login',
  'https://gs-pipeline-app-2.vercel.app/api/auth/login',
];

for (const url of urls) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
    });
    const data = await r.json();
    console.log(`${url}`);
    console.log(`  Status: ${r.status} | Token: ${data.token ? 'OK (' + data.token.slice(0, 20) + '...)' : 'NONE'} | Error: ${data.error || 'none'}`);
  } catch (e) {
    console.error(`${url} => ERROR: ${e.message}`);
  }
}
