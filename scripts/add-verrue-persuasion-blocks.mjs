// scripts/add-verrue-persuasion-blocks.mjs
// Ajoute 3 blocs persuasion (titre + image) entre la STATS BAR et la PROBLEM SECTION
// Usage: node scripts/add-verrue-persuasion-blocks.mjs

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUG = 'creme-verrue-tk';

const IMG = 'https://coachingexpertci.com/wp-content/uploads/2026/04/';

const PERSUASION_BLOCKS = [
  {
    title: 'Une peau enfin nette en 7 jours',
    subtitle: 'Verrues, acrochordons, callosites... Disparus pour de bon. Cette transformation, des centaines de clients ivoiriens la vivent chaque mois. Aujourd\'hui, c\'est votre tour.',
    img: IMG + 'fait_une_photo_202604182005-1.jpg',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-rose-600',
    ctaLabel: 'Je veux ce resultat',
  },
  {
    title: 'La douceur que vous meritez',
    subtitle: 'Notre formule premium agit en profondeur, sans douleur, sans cicatrice. Retrouvez la confiance et le sourire des les premiers jours d\'utilisation.',
    img: IMG + 'je_veux_en_202604182010.jpg',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-fuchsia-600',
    ctaLabel: 'Commander mon kit',
  },
  {
    title: 'Fini les verrues et acrochordons',
    subtitle: 'Keratoses, papillomes, grains de beaute genants... Notre creme dermo-active elimine toutes les imperfections cutanees en 7 a 14 jours. Action ciblee, peau nette, resultat garanti.',
    img: IMG + 'je_veux_en_202604182011-1.jpg',
    gradientFrom: 'from-fuchsia-600',
    gradientTo: 'to-violet-600',
    ctaLabel: 'Je commande maintenant',
  },
];

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) {
    console.error('Login failed:', res.status, await res.text());
    process.exit(1);
  }
  return (await res.json()).token;
}

async function run() {
  console.log('Fetching current config...');
  const tplRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const data = await tplRes.json();
  const id = data.template.id;
  const cfg = JSON.parse(data.template.config);
  console.log(`  Template ID: ${id}, templateVersion: ${cfg.templateVersion}`);
  console.log(`  Existing persuasionBlocks: ${cfg.persuasionBlocks?.length ?? 0}`);

  cfg.persuasionBlocks = PERSUASION_BLOCKS;

  console.log('Logging in...');
  const token = await login();

  console.log('PUT template...');
  const putRes = await fetch(`${API_URL}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  if (!putRes.ok) {
    console.error('Update failed:', putRes.status, await putRes.text());
    process.exit(1);
  }
  console.log('  OK');

  console.log('\nVerifying...');
  const verifyRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const v = JSON.parse((await verifyRes.json()).template.config);
  console.log(`  persuasionBlocks: ${v.persuasionBlocks?.length}`);
  v.persuasionBlocks?.forEach((b, i) => {
    console.log(`   ${i + 1}. ${b.title}`);
    console.log(`       img: ${b.img}`);
  });
  console.log('\nDONE. Visit:');
  console.log('  https://obrille.com/creme-verrue-tk');
  console.log('  https://coachingexpertci.com/creme-verrue-tk');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
