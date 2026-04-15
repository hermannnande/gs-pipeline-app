const API = 'https://gs-pipeline-app-2.vercel.app/api';
const PRICES = { 1: 9900, 2: 16900, 3: 24900 };

const SLUGS_TO_FIX = [
  'chaussette-compression',
  'creme-anti-verrue',
  'creme-verrue-tk',
  'crememinceurfb',
  'spraydouleurtk',
  'patchdouleurtk',
];

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  const d = await res.json();
  if (!d.token) throw new Error('Login failed: ' + JSON.stringify(d));
  return d.token;
}

function fmt(v) {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function fixQtyOptions(opts) {
  if (!opts) return opts;
  return opts.map(o => {
    const v = o.v;
    const price = PRICES[v] || PRICES[1];
    const newSub = fmt(price);

    let save = '';
    if (v === 2) save = `Economisez ${fmt(PRICES[1] * 2 - PRICES[2])}`.replace(' FCFA', ' F');
    if (v === 3) save = `Economisez ${fmt(PRICES[1] * 3 - PRICES[3])}`.replace(' FCFA', ' F');

    return { ...o, sub: newSub, ...(save ? { save } : {}) };
  });
}

function fixBundles(bundles) {
  if (!bundles) return bundles;
  return bundles.map(b => {
    const v = b.v;
    const totalPrice = PRICES[v] || PRICES[1];
    const unitPrice = Math.round(totalPrice / v);

    let save = '';
    if (v === 2) save = `Economisez ${fmt(PRICES[1] * 2 - PRICES[2])}`;
    if (v === 3) save = `Economisez ${fmt(PRICES[1] * 3 - PRICES[3])}`;

    return {
      ...b,
      totalPrice,
      unitPrice,
      ...(save ? { save } : {}),
    };
  });
}

async function run() {
  const token = await login();
  console.log('Logged in OK\n');

  const listRes = await fetch(`${API}/templates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { templates } = await listRes.json();

  for (const slug of SLUGS_TO_FIX) {
    const t = templates.find(x => x.slug === slug);
    if (!t) { console.log(`SKIP: ${slug} not found`); continue; }

    const cfg = typeof t.config === 'string' ? JSON.parse(t.config) : { ...t.config };

    console.log(`--- ${slug} (id=${t.id}) ---`);
    console.log(`  AVANT: prices=${JSON.stringify(cfg.prices)}`);

    cfg.prices = { ...PRICES };
    cfg.qtyOptions = fixQtyOptions(cfg.qtyOptions);
    cfg.bundles = fixBundles(cfg.bundles);

    const updateRes = await fetch(`${API}/templates/${t.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ config: cfg }),
    });

    if (updateRes.ok) {
      const { template: updated } = await updateRes.json();
      const newCfg = typeof updated.config === 'string' ? JSON.parse(updated.config) : updated.config;
      console.log(`  APRES: prices=${JSON.stringify(newCfg.prices)}`);
      if (newCfg.qtyOptions) {
        newCfg.qtyOptions.forEach(o => console.log(`    qty=${o.v} sub="${o.sub}" save="${o.save || ''}"`));
      }
      console.log(`  OK\n`);
    } else {
      console.log(`  ERREUR: ${updateRes.status} ${await updateRes.text()}\n`);
    }
  }

  console.log('\n=== VERIFICATION FINALE ===\n');
  for (const slug of [...SLUGS_TO_FIX, 'creme-ongle-incarne']) {
    const res = await fetch(`${API}/templates/public/${slug}`);
    const { template: t } = await res.json();
    const cfg = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
    const p = cfg.prices;
    const ok = p[1] === 9900 && p[2] === 16900 && p[3] === 24900;
    console.log(`${ok ? 'OK' : 'FAUX'} ${slug}: 1=${p[1]} 2=${p[2]} 3=${p[3]}`);
  }
}

run().catch(e => console.error(e));
