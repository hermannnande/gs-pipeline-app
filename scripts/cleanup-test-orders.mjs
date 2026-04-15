const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  const data = await res.json();
  return data.token;
}

const token = await login();

const testIds = [18443, 18444, 18445, 18446, 18447];
for (const id of testIds) {
  const r = await fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  console.log(`Delete order #${id}: ${r.status}`);
}
