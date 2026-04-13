const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const PATCH_CONFIG = {
  productCode: 'PATCH_DOULEUR_TK',
  title: 'Patch Anti-Douleur Chauffant TK',
  subtitle: 'Soulagement instantane',
  description: 'Posez le patch sur la zone douloureuse et ressentez un soulagement immediat. Mal de dos, arthrose, sciatique, tensions — une solution simple et efficace.',
  badge: 'NOUVEAU',
  prices: { 1: 9900, 2: 14900, 3: 24900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 boite', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 boites', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ],
  images: {
    hero: '/patch-douleur-tk/hero.webp',
    gallery: [
      '/patch-douleur-tk/gallery-1.webp',
      '/patch-douleur-tk/gallery-2.webp',
      '/patch-douleur-tk/gallery-3.webp',
    ],
    usage: '/patch-douleur-tk/usage.webp',
    banner: '/patch-douleur-tk/banner.webp',
    avant: '/patch-douleur-tk/avant.webp',
    apres: '/patch-douleur-tk/apres.webp',
  },
  videos: [
    '/patch-douleur-tk/video-1.mp4',
    '/patch-douleur-tk/video-2.mp4',
    '/patch-douleur-tk/video-3.mp4',
  ],
  colors: {
    theme: 'blue',
  },
  reviews: [
    { init: 'SK', bg: 'bg-sky-500', n: 'Sidibe K.', v: 'Abidjan', q: 'En 3 secondes la douleur a disparu. Incroyable.', s: 5 },
    { init: 'AB', bg: 'bg-cyan-500', n: 'Aminata B.', v: 'Bouake', q: 'Mon mal de dos me faisait souffrir depuis des mois. Le patch m\'a sauve.', s: 5 },
    { init: 'YD', bg: 'bg-teal-500', n: 'Yao D.', v: 'Yopougon', q: 'Je le porte tous les jours au travail. Plus de douleur.', s: 5 },
    { init: 'KN', bg: 'bg-indigo-500', n: 'Kone N.', v: 'Daloa', q: 'Ma sciatique ne me gene plus. Merci.', s: 5 },
    { init: 'FM', bg: 'bg-violet-500', n: 'Fatou M.', v: 'San Pedro', q: 'Service rapide et le produit marche vraiment.', s: 4 },
    { init: 'OT', bg: 'bg-blue-500', n: 'Oumar T.', v: 'Korhogo', q: 'Mon pere l\'utilise pour ses rhumatismes. Il revit.', s: 5 },
  ],
  toasts: [
    { n: 'Sidibe K.', v: 'Abidjan', t: '3 min' },
    { n: 'Aminata B.', v: 'Bouake', t: '7 min' },
    { n: 'Yao D.', v: 'Yopougon', t: '10 min' },
    { n: 'Kone N.', v: 'Daloa', t: '14 min' },
    { n: 'Fatou M.', v: 'San Pedro', t: '18 min' },
  ],
  sections: {
    marqueeTexts: [
      'Soulagement instantane',
      'Patch chauffant anti-douleur',
      'Livraison 24h Abidjan',
      'Paiement a la livraison',
    ],
    catchphrase: {
      text: 'Finis les douleurs en 3 secondes',
      sub: 'Un patch, une pose, un soulagement immediat. Mal de dos, arthrose, sciatique, rhumatisme — retrouvez votre confort.',
    },
    stats: [
      { n: '800+', l: 'Utilisateurs satisfaits' },
      { n: '24h', l: 'Livraison Abidjan' },
      { n: '4.7/5', l: 'Note moyenne' },
      { n: '97%', l: 'Recommandent' },
    ],
    howToUse: [
      { n: '01', t: 'Retirez', d: 'Retirez le film protecteur du patch.', ico: '🩹' },
      { n: '02', t: 'Appliquez', d: 'Posez le patch sur la zone douloureuse.', ico: '✋' },
      { n: '03', t: 'Chauffez', d: 'Le patch chauffe en quelques secondes.', ico: '🔥' },
      { n: '04', t: 'Soulagez', d: 'Ressentez un soulagement immediat.', ico: '✨' },
    ],
    faq: [
      { q: 'Combien de temps dure le soulagement ?', a: 'Le patch agit pendant 8 a 12 heures.' },
      { q: 'Est-ce adapte pour le mal de dos ?', a: 'Oui. Dos, epaules, genoux, sciatique, rhumatisme.' },
      { q: 'Dois-je payer avant la livraison ?', a: 'Non. Paiement a la reception uniquement.' },
      { q: 'Combien de patchs dans une boite ?', a: 'Chaque boite contient plusieurs patchs pour un traitement complet.' },
      { q: 'Y a-t-il des effets secondaires ?', a: 'Non. Le patch est naturel et sans danger.' },
      { q: 'Peut-on le porter sous les vetements ?', a: 'Oui. Discret et confortable toute la journee.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '🩹', t: 'Naturel & sur', d: 'Sans effets secondaires' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
    ],
  },
  thankYouUrl: '/patch-douleur/merci',
};

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Login failed:', res.status, body);
    process.exit(1);
  }
  const data = await res.json();
  return data.token;
}

async function run() {
  console.log('Logging in...');
  const token = await login();
  console.log('Logged in. Updating template ID 2...');

  const res = await fetch(`${API_URL}/templates/2`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      nom: 'Patch Anti-Douleur TK',
      description: 'Finis les douleurs en 3 secondes — patch chauffant anti-douleur',
      productCode: 'PATCH_DOULEUR_TK',
      config: JSON.stringify(PATCH_CONFIG, null, 2),
      assetsFolder: 'patch-douleur-tk',
      actif: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Update failed:', res.status, body);
    process.exit(1);
  }

  const data = await res.json();
  console.log('Template updated:', data.template.nom);
  console.log('Slug:', data.template.slug);
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
