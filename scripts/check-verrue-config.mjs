const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

for (const slug of ['creme-anti-verrue', 'creme-verrue-tk']) {
  const r = await fetch(`${API_URL}/templates/public/${slug}`);
  const d = await r.json();
  const cfg = JSON.parse(d.template.config);
  console.log(`\n=== ${slug} (V${cfg.templateVersion}) ===`);
  console.log('prices:', JSON.stringify(cfg.prices));
  console.log('qtyOptions:', JSON.stringify(cfg.qtyOptions, null, 2));
  if (cfg.bundles) console.log('bundles:', JSON.stringify(cfg.bundles, null, 2));
}
