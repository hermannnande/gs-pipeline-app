const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const PIXEL_ID = '1639149310623476';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  return (await res.json()).token;
}

const token = await login();

// Get current template
const tpl = await fetch(`${API_URL}/templates/public/creme-ongle-incarne`);
const tplData = await tpl.json();
if (!tplData.template) { console.error('Template not found!'); process.exit(1); }

const cfg = JSON.parse(tplData.template.config);
console.log('Current metaPixelId:', cfg.metaPixelId || 'NONE');
console.log('productCode:', cfg.productCode);

// Add pixel ID
cfg.metaPixelId = PIXEL_ID;

// Update template
const update = await fetch(`${API_URL}/templates/${tplData.template.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
  },
  body: JSON.stringify({ config: JSON.stringify(cfg) }),
});
const result = await update.json();
console.log('Update status:', update.status);

// Verify
const verify = await fetch(`${API_URL}/templates/public/creme-ongle-incarne`);
const vData = await verify.json();
const vCfg = JSON.parse(vData.template.config);
console.log('Verified metaPixelId:', vCfg.metaPixelId);
