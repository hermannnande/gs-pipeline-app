const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function run() {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  const { token } = await loginRes.json();
  console.log('Logged in');

  const res = await fetch(`${API_URL}/templates/5`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ productId: 41 }),
  });
  const data = await res.json();
  console.log('Updated:', data.template?.nom, '- productId:', data.template?.productId);
}

run().catch(e => { console.error(e); process.exit(1); });
