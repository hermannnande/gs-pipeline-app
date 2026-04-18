// scripts/update-verrue-images.mjs
// Met a jour les images du carrousel de creme-verrue-tk
// Usage: node scripts/update-verrue-images.mjs [--reviews]

const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUG = 'creme-verrue-tk';

const NEW_IMG = 'https://coachingexpertci.com/wp-content/uploads/2026/04/';

const NEW_HERO = NEW_IMG + 'fait_une_affiche_202604182012.jpg';
const NEW_GALLERY = [
  NEW_IMG + 'fait_une_photo_202604182011.jpg',
  NEW_IMG + 'fait_un_avant_202604182008.jpg',
  NEW_IMG + 'Design-sans-titre-7.jpg',
  NEW_IMG + 'fait_une_photo_202604182007.jpg',
];

const NEW_TRUST_STRIP = [
  NEW_IMG + 'fait_une_photo_202604182011.jpg',
  NEW_IMG + 'fait_un_avant_202604182008.jpg',
  NEW_IMG + 'Design-sans-titre-7.jpg',
  NEW_IMG + 'fait_une_photo_202604182007.jpg',
];

const NEW_BUNDLE_IMG = NEW_IMG + 'fait_une_affiche_202604182012.jpg';

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
  const updateReviews = process.argv.includes('--reviews');

  console.log('Fetching current config...');
  const tplRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  if (!tplRes.ok) {
    console.error('Cannot fetch template:', tplRes.status);
    process.exit(1);
  }
  const data = await tplRes.json();
  const id = data.template.id;
  const cfg = JSON.parse(data.template.config);
  console.log(`  Template ID: ${id}`);
  console.log(`  templateVersion: ${cfg.templateVersion}`);

  const oldGallery = cfg.images.gallery || [];
  const videos = oldGallery.filter((u) => /\.(mp4|webm|mov)$/i.test(u));
  console.log(`  Preserving ${videos.length} video(s) from gallery`);

  cfg.images.hero = NEW_HERO;
  cfg.images.gallery = [...NEW_GALLERY, ...videos];
  cfg.images.trustStrip = NEW_TRUST_STRIP;

  if (Array.isArray(cfg.bundles)) {
    cfg.bundles.forEach((b) => {
      if (b.img) b.img = NEW_BUNDLE_IMG;
    });
  }

  if (cfg.sections?.solutionPoints?.length) {
    const solutionImgs = [
      NEW_IMG + 'fait_une_affiche_202604182012.jpg',
      NEW_IMG + 'fait_une_photo_202604182011.jpg',
      NEW_IMG + 'fait_un_avant_202604182008.jpg',
      NEW_IMG + 'Design-sans-titre-7.jpg',
    ];
    cfg.sections.solutionPoints.forEach((p, i) => {
      if (p.img && solutionImgs[i]) p.img = solutionImgs[i];
    });
  }

  if (updateReviews) {
    const verifiedAvatars = {
      women: [
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=400&fit=crop&q=80',
      ],
      men: [
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=400&fit=crop&q=80',
      ],
    };
    cfg.reviews?.forEach((r) => {
      const isMan = ['Ibrahim', 'Kouame', 'Drissa'].some((m) => r.n?.startsWith(m));
      r.img = isMan ? verifiedAvatars.men[0] : verifiedAvatars.women[0];
    });
    console.log('  Updated review avatars (--reviews flag)');
  }

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

  console.log('Verifying...');
  const verifyRes = await fetch(`${API_URL}/templates/public/${SLUG}`);
  const v = JSON.parse((await verifyRes.json()).template.config);
  console.log('  hero:', v.images.hero);
  console.log('  gallery:');
  v.images.gallery.forEach((g, i) => console.log('   ', i, g));
  console.log('  trustStrip:');
  v.images.trustStrip?.forEach((t, i) => console.log('   ', i, t));
  if (updateReviews) {
    console.log('  reviews imgs:');
    v.reviews?.forEach((r, i) => console.log('   ', i, r.n, '->', r.img));
  }
  console.log('\nDONE. Visit:');
  console.log('  https://obrille.com/creme-verrue-tk');
  console.log('  https://coachingexpertci.com/creme-verrue-tk');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
