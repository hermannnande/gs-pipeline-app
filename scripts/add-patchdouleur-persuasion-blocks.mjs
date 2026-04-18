// scripts/add-patchdouleur-persuasion-blocks.mjs
// Ajoute 3 blocs persuasion (titre + image) entre la STATS BAR et le BANNER
// pour le produit "Patch Anti-Douleur Chauffant TK".
// Usage: node scripts/add-patchdouleur-persuasion-blocks.mjs

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUG = 'patchdouleurtk';

const IMG = 'https://coachingexpertci.com/wp-content/uploads/2026/04/';

const PERSUASION_BLOCKS = [
  {
    title: 'Stop au mal de dos qui vous empoisonne la vie',
    subtitle: 'Lombalgie, sciatique, tensions musculaires... Chaque mouvement devient une epreuve. Le patch chauffant TK diffuse une chaleur therapeutique pendant 8 heures, soulage la douleur en 5 minutes et vous redonne enfin la liberte de bouger sans souffrir.',
    img: IMG + 'Man_with_back_202604182201-1.jpeg',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-orange-600',
    ctaLabel: 'Soulager mon dos maintenant',
  },
  {
    title: 'Retrouvez la complicite avec ceux que vous aimez',
    subtitle: 'Marcher main dans la main, danser, voyager, jouer avec vos enfants... La douleur ne doit plus jamais vous empecher de vivre vos plus beaux moments. Reprenez vos activites preferees, sans douleur, sans medicament, sans effets secondaires.',
    img: IMG + 'Man_and_woman_202604182201-1.jpeg',
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-amber-600',
    ctaLabel: 'Je veux ma liberte',
  },
  {
    title: 'Apaisement durable pour les douleurs chroniques',
    subtitle: 'Arthrose, rhumatismes, raideurs articulaires liees a l\'age... Notre patch chauffant TK est la solution naturelle plebiscitee par des centaines de seniors en Cote d\'Ivoire. Action profonde, soulagement immediat, mobilite retrouvee.',
    img: IMG + 'Vieux_noir_mal_202604182200-1.jpeg',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-red-600',
    ctaLabel: 'Commander mes patchs',
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
  console.log(`  Template ID: ${id}, templateVersion: ${cfg.templateVersion ?? '(V1)'}`);
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
  console.log('  https://obrille.com/patchdouleurtk');
  console.log('  https://coachingexpertci.com/patchdouleurtk');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
