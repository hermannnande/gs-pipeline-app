for (const base of ['https://obgestion.com', 'https://www.obgestion.com']) {
  const url = `${base}/api/auth/login`;
  console.log(`\n--- ${url} ---`);
  
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
    redirect: 'manual',
  });
  
  console.log('Status:', r.status);
  console.log('Location:', r.headers.get('location') || 'none');
  
  if (r.status >= 300 && r.status < 400) {
    console.log('REDIRECT DETECTED! This could break POST requests.');
  } else {
    const data = await r.json();
    console.log('Token:', data.token ? 'OK' : 'NONE');
  }
}
