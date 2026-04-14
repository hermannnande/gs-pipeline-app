const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const MINCEUR_CONFIG = {
  productCode: 'CREME_MINCEUR',
  title: 'Creme Minceur Brule-Graisse',
  subtitle: 'Ventre plat & silhouette affinee',
  description: 'Creme minceur a effet chauffant pour accompagner l\'amincissement de la silhouette. Application simple, sensation agreable, resultats visibles.',
  badge: 'BEST-SELLER',
  prices: { 1: 9900, 2: 14900, 3: 24900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 pot', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 pots', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 pots', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ],
  images: {
    hero: '/creme-minceur/hero.webp',
    gallery: [
      '/creme-minceur/gallery-1.webp',
      '/creme-minceur/gallery-2.webp',
      '/creme-minceur/gallery-3.webp',
    ],
    usage: '/creme-minceur/hero.webp',
    banner: '/creme-minceur/hero.webp',
    avant: '/creme-minceur/avant.webp',
    apres: '/creme-minceur/apres.webp',
  },
  videos: [
    '/creme-minceur/video-1.mp4',
    '/creme-minceur/video-2.mp4',
    '/creme-minceur/video-3.mp4',
  ],
  colors: {
    theme: 'rose',
  },
  reviews: [
    { init: 'AK', bg: 'bg-rose-500', n: 'Aminata K.', v: 'Abidjan', q: 'Franchement satisfaite ! La creme chauffe bien, mon ventre s\'affine petit a petit.', s: 5 },
    { init: 'MN', bg: 'bg-pink-500', n: 'Mariam N.', v: 'Yopougon', q: 'Apres quelques jours ma taille parait plus dessinee et la peau plus lisse.', s: 5 },
    { init: 'SK', bg: 'bg-fuchsia-500', n: 'Sara K.', v: 'Cocody', q: 'Au debut j\'avais des doutes mais le produit est top. Mon ventre est plus ferme.', s: 5 },
    { init: 'FD', bg: 'bg-rose-400', n: 'Fatou D.', v: 'Bingerville', q: 'La creme laisse une sensation agreable et chauffante. Je me sens mieux dans mes vetements.', s: 5 },
    { init: 'CB', bg: 'bg-pink-400', n: 'Clarisse B.', v: 'Marcory', q: 'Je l\'utilise avec mes exercices et le rendu est super. Merci pour le serieux.', s: 5 },
    { init: 'EL', bg: 'bg-fuchsia-400', n: 'Estelle L.', v: 'Treichville', q: 'Mon produit prefere pour la taille et le ventre. Application facile, resultat visible.', s: 5 },
  ],
  toasts: [
    { n: 'Aminata K.', v: 'Abidjan', t: '2 min' },
    { n: 'Mariam N.', v: 'Yopougon', t: '5 min' },
    { n: 'Sara K.', v: 'Cocody', t: '9 min' },
    { n: 'Fatou D.', v: 'Bingerville', t: '12 min' },
    { n: 'Clarisse B.', v: 'Marcory', t: '16 min' },
  ],
  sections: {
    marqueeTexts: [
      'Ventre plat garanti',
      'Creme minceur brule-graisse',
      'Livraison 24h Abidjan',
      'Paiement a la livraison',
    ],
    catchphrase: {
      text: 'Dites STOP aux graisses localisees',
      sub: 'Creme minceur a effet chauffant. Appliquez matin et soir sur le ventre, les hanches et les cuisses pour une silhouette visiblement affinee.',
    },
    stats: [
      { n: '1 500+', l: 'Clientes satisfaites' },
      { n: '24h', l: 'Livraison Abidjan' },
      { n: '4.9/5', l: 'Note moyenne' },
      { n: '98%', l: 'Recommandent' },
    ],
    howToUse: [
      { n: '01', t: 'Nettoyez', d: 'Lavez et sechez la zone a traiter.', ico: '🚿' },
      { n: '02', t: 'Appliquez', d: 'Etalez la creme sur ventre, hanches ou cuisses.', ico: '🧴' },
      { n: '03', t: 'Massez', d: 'Massez en mouvements circulaires 2-3 minutes.', ico: '✋' },
      { n: '04', t: 'Admirez', d: 'Constatez les resultats au fil des jours.', ico: '✨' },
    ],
    faq: [
      { q: 'Quand vais-je voir les resultats ?', a: 'Les premiers resultats sont visibles apres quelques jours d\'utilisation reguliere.' },
      { q: 'La creme chauffe-t-elle ?', a: 'Oui, un leger effet chauffant agreable qui favorise l\'action brule-graisse.' },
      { q: 'Dois-je payer avant la livraison ?', a: 'Non. Paiement a la reception uniquement.' },
      { q: 'Convient a tous les types de peau ?', a: 'Oui. Formule douce adaptee a toutes les peaux.' },
      { q: 'Combien de fois par jour ?', a: '2 applications par jour recommandees : matin et soir.' },
      { q: 'Peut-on l\'utiliser sur les cuisses ?', a: 'Oui. Ventre, hanches, cuisses et bras.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '🌿', t: 'Formule naturelle', d: 'Effet chauffant' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
    ],
  },
  thankYouUrl: '/landing/crememinceurfb/merci',
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
  console.log('Logged in. Updating template ID 6...');

  const res = await fetch(`${API_URL}/templates/6`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      nom: 'Creme Minceur Brule-Graisse',
      description: 'Creme minceur ventre plat — effet chauffant brule-graisse',
      productCode: 'CREME_MINCEUR',
      config: JSON.stringify(MINCEUR_CONFIG, null, 2),
      assetsFolder: 'creme-minceur',
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
