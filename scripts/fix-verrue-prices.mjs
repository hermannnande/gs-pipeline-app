const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUGS = ['creme-verrue-tk', 'creme-anti-verrue'];
const CORRECT_PRICES = { "1": 9900, "2": 16000, "3": 24900 };

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  return (await res.json()).token;
}

const token = await login();

for (const slug of SLUGS) {
  console.log(`\n=== ${slug} ===`);
  const tpl = await fetch(`${API_URL}/templates/public/${slug}`);
  const data = await tpl.json();
  if (!data.template) { console.log('  Template non trouve!'); continue; }

  const cfg = JSON.parse(data.template.config);
  console.log('  Ancien prix:', JSON.stringify(cfg.prices));

  cfg.prices = CORRECT_PRICES;

  // Also fix qtyOptions/bundles if they exist
  if (cfg.qtyOptions) {
    for (const opt of cfg.qtyOptions) {
      if (opt.qty === 1) opt.price = 9900;
      if (opt.qty === 2) opt.price = 16000;
      if (opt.qty === 3) opt.price = 24900;
    }
    console.log('  qtyOptions corriges');
  }
  if (cfg.bundles) {
    for (const b of cfg.bundles) {
      if (b.qty === 1) b.price = 9900;
      if (b.qty === 2) b.price = 16000;
      if (b.qty === 3) b.price = 24900;
    }
    console.log('  bundles corriges');
  }

  const update = await fetch(`${API_URL}/templates/${data.template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  console.log('  Update:', update.status);

  // Verify
  const v = await fetch(`${API_URL}/templates/public/${slug}`);
  const vd = await v.json();
  const vc = JSON.parse(vd.template.config);
  console.log('  Nouveau prix:', JSON.stringify(vc.prices));
}
