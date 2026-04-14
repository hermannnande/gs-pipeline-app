const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const SPRAY_CONFIG = {
  productCode: 'SPRAY_DOULEUR',
  title: 'Spray Anti-Douleur Stop Douleur',
  subtitle: 'Soulagement instantane',
  description: 'Spray anti-douleur a l\'huile de magnesium et au venin d\'abeille. 2-3 pulverisations et tu sens un vrai soulagement. Pratique, rapide, efficace.',
  badge: 'NOUVEAU',
  prices: { 1: 9900, 2: 14900, 3: 24900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 spray', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 sprays', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 sprays', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ],
  images: {
    hero: '/spray-douleur/hero.webp',
    gallery: [
      '/spray-douleur/gallery-1.webp',
      '/spray-douleur/gallery-2.webp',
      '/spray-douleur/gallery-3.webp',
    ],
    usage: '/spray-douleur/usage.webp',
    banner: '/spray-douleur/hero.webp',
    avant: '/spray-douleur/avant.webp',
    apres: '/spray-douleur/apres.webp',
  },
  videos: [
    '/spray-douleur/video-1.mp4',
  ],
  colors: {
    theme: 'emerald',
  },
  reviews: [
    { init: 'AK', bg: 'bg-emerald-500', n: 'Aicha K.', v: 'Abidjan', q: 'En 2 jours la douleur au genou a beaucoup diminue. Je marche mieux.', s: 5 },
    { init: 'MS', bg: 'bg-teal-500', n: 'Mamadou S.', v: 'Bouake', q: 'Mon dos me faisait souffrir. Apres 3 applications, soulagement net. Tres efficace.', s: 5 },
    { init: 'FD', bg: 'bg-green-500', n: 'Fatou D.', v: 'Yopougon', q: 'Ma mere a l\'arthrose. Depuis le spray, elle dort mieux et se plaint moins.', s: 5 },
    { init: 'KY', bg: 'bg-lime-600', n: 'Konan Y.', v: 'Daloa', q: 'C\'est puissant. La douleur au poignet a baisse rapidement. Je recommande a 100%.', s: 5 },
    { init: 'BT', bg: 'bg-cyan-500', n: 'Bamba T.', v: 'San Pedro', q: 'Spray pratique, effet rapide. Mon epaule me genait, c\'est fini.', s: 4 },
    { init: 'SA', bg: 'bg-indigo-500', n: 'Sylvie A.', v: 'Korhogo', q: 'Mes rhumatismes me faisaient souffrir la nuit. Le spray m\'a soulagee.', s: 5 },
  ],
  toasts: [
    { n: 'Aicha K.', v: 'Abidjan', t: '2 min' },
    { n: 'Mamadou S.', v: 'Bouake', t: '6 min' },
    { n: 'Fatou D.', v: 'Yopougon', t: '9 min' },
    { n: 'Konan Y.', v: 'Daloa', t: '13 min' },
    { n: 'Bamba T.', v: 'San Pedro', t: '17 min' },
  ],
  sections: {
    marqueeTexts: [
      'Dites adieu aux douleurs',
      'Spray anti-douleur efficace',
      'Livraison 24h Abidjan',
      'Paiement a la livraison',
    ],
    catchphrase: {
      text: 'Dites adieu aux douleurs articulaires',
      sub: '2-3 pulverisations sur la zone douloureuse et ressentez un soulagement immediat. Arthrose, arthrite, rhumatisme, sciatique.',
    },
    stats: [
      { n: '600+', l: 'Clients soulages' },
      { n: '24h', l: 'Livraison Abidjan' },
      { n: '4.7/5', l: 'Note moyenne' },
      { n: '96%', l: 'Recommandent' },
    ],
    howToUse: [
      { n: '01', t: 'Agitez', d: 'Agitez le flacon avant utilisation.', ico: '🔄' },
      { n: '02', t: 'Pulverisez', d: '2-3 pulverisations sur la zone douloureuse.', ico: '🧴' },
      { n: '03', t: 'Massez', d: 'Massez legerement pour faire penetrer.', ico: '✋' },
      { n: '04', t: 'Soulagez', d: 'Ressentez le soulagement en quelques secondes.', ico: '✨' },
    ],
    faq: [
      { q: 'Combien de temps dure l\'effet ?', a: 'Le soulagement dure plusieurs heures apres application.' },
      { q: 'Pour quelles douleurs ?', a: 'Arthrose, arthrite, rhumatisme, sciatique, douleurs musculaires et articulaires.' },
      { q: 'Dois-je payer avant ?', a: 'Non. Paiement a la livraison uniquement.' },
      { q: 'Combien de pulverisations par flacon ?', a: 'Chaque flacon contient assez pour plusieurs semaines d\'utilisation.' },
      { q: 'Y a-t-il des effets secondaires ?', a: 'Non. Formule naturelle a base d\'huile de magnesium et venin d\'abeille.' },
      { q: 'Peut-on l\'utiliser plusieurs fois par jour ?', a: 'Oui. 2-3 applications par jour recommandees.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '🌿', t: 'Formule naturelle', d: 'Magnesium + venin d\'abeille' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
    ],
  },
  thankYouUrl: '/landing/spraydouleurtk/merci',
};

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) { console.error('Login failed:', res.status); process.exit(1); }
  return (await res.json()).token;
}

async function run() {
  console.log('Logging in...');
  const token = await login();
  console.log('Logged in. Creating spray template...');

  const res = await fetch(`${API_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      nom: 'Spray Anti-Douleur TK',
      slug: 'spraydouleurtk',
      description: 'Dites adieu aux douleurs — spray anti-douleur magnesium + venin d\'abeille',
      productCode: 'SPRAY_DOULEUR',
      config: JSON.stringify(SPRAY_CONFIG, null, 2),
      assetsFolder: 'spray-douleur',
      actif: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Create failed:', res.status, body);
    process.exit(1);
  }

  const data = await res.json();
  console.log('Template created:', data.template.nom);
  console.log('ID:', data.template.id);
  console.log('Slug:', data.template.slug);
  console.log('URL: https://www.obgestion.com/landing/spraydouleurtk');
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
