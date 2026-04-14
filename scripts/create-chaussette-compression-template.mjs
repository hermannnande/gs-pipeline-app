const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const CONFIG = {
  templateVersion: 2,
  productCode: 'CHAUSSETTE_COMPRESSION_LONG',
  title: 'Chaussettes de Compression Anti-Douleur',
  subtitle: 'Soulagement instantane pour vos jambes',
  description: 'Soulagez instantanement vos douleurs de pieds, jambes lourdes et gonflements. Compression graduee 20-30mmHg. Confort toute la journee.',
  badge: 'BEST-SELLER',
  prices: { 1: 9900, 2: 14900, 3: 19900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 paire', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 paires', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 paires', sub: '19 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 9 800 F' },
  ],
  images: {
    hero: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
    gallery: [
      'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
      'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
      'https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png',
    ],
    lifestyle: [
      'https://obrille.com/wp-content/uploads/2026/04/Douleur-et-inconfort-sur-fauteuil-beige-1.png',
      'https://obrille.com/wp-content/uploads/2026/04/Femme-attentive-a-ses-pieds-endoloris-1.png',
      'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
    ],
    trustStrip: [
      'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
      'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
      'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
      'https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png',
    ],
  },
  reviews: [
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png',
      n: 'Aminata K.', v: 'Abidjan — Cocody', q: 'Mes pieds etaient gonfles tous les soirs apres le travail. Depuis que je porte ces chaussettes, plus aucun gonflement. Je suis debout 10h par jour et mes jambes ne me font plus mal. Tres confortable.',
      s: 5, verified: true, date: 'Il y a 3 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
      n: 'Mariam D.', v: 'Yopougon', q: 'J\'ai des varices depuis 2 ans. Le medecin m\'a recommande des chaussettes de compression. Celles-ci sont parfaites : confortables, faciles a enfiler et le soulagement est immediat.',
      s: 5, verified: true, date: 'Il y a 1 semaine',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
      n: 'Fatou S.', v: 'Marcory', q: 'Je suis infirmiere et je fais des gardes de 12h. Ces chaussettes ont change ma vie. Plus de jambes lourdes le soir. Je les recommande a toutes mes collegues.',
      s: 5, verified: true, date: 'Il y a 5 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
      n: 'Kouassi B.', v: 'Bouake', q: 'Mon pere a le diabete et ses pieds gonflent beaucoup. Depuis qu\'il porte ces chaussettes, il marche mieux et se plaint moins. Merci beaucoup.',
      s: 5, verified: true, date: 'Il y a 2 semaines',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png',
      n: 'Sarah T.', v: 'Plateau', q: 'La compression est ferme mais confortable. Faciles a enfiler, et le service client est excellent ! Je marche toute la journee sans douleur maintenant.',
      s: 5, verified: true, date: 'Il y a 1 semaine',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
      n: 'Clara M.', v: 'Treichville', q: 'J\'etais sceptique au debut. Mais des le premier jour je sentais la difference. Plus de gonflement aux chevilles le soir. Je commande 2 paires de plus.',
      s: 5, verified: true, date: 'Il y a 4 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
      n: 'Eliane B.', v: 'Cocody', q: 'Ces chaussettes sont un game changer. Mes pieds arthritiques ne me font plus souffrir. Le tissu est doux et respirant. Je les porte tous les jours.',
      s: 5, verified: true, date: 'Il y a 6 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
      n: 'Gloria C.', v: 'Marcory', q: 'Elles sont agreables sur mes jambes, sans sensation de restriction ni de douleur. J\'adore la facon dont elles s\'ajustent parfaitement a mon mollet.',
      s: 5, verified: true, date: 'Il y a 2 semaines',
    },
  ],
  toasts: [
    { n: 'Aminata K.', v: 'Cocody', t: '2 min' },
    { n: 'Jean-Marc B.', v: 'Bouake', t: '5 min' },
    { n: 'Mariam D.', v: 'Yopougon', t: '8 min' },
    { n: 'Fatou S.', v: 'Marcory', t: '14 min' },
    { n: 'Kouassi B.', v: 'Daloa', t: '18 min' },
  ],
  bundles: [
    {
      v: 1, label: '1 paire', unitPrice: 9900, totalPrice: 9900,
      perDay: 'Soit 330 F / jour',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
    },
    {
      v: 2, label: '2 paires', unitPrice: 7450, totalPrice: 14900,
      save: 'Economisez 4 900 F', tag: 'POPULAIRE',
      perDay: 'Soit 248 F / jour',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
    },
    {
      v: 3, label: '3 paires', unitPrice: 6633, totalPrice: 19900,
      save: 'Economisez 9 800 F', tag: 'MEILLEURE OFFRE',
      perDay: 'Soit 221 F / jour',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
    },
  ],
  sections: {
    marqueeTexts: [
      'Soulagement instantane',
      'Compression medicale 20-30mmHg',
      'Livraison 24h Abidjan',
      'Paiement a la livraison',
      '+94 000 clients satisfaits',
    ],
    stickers: [
      { text: '🏥 Recommande par les medecins', color: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
      { text: '⚡ Soulagement immediat', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
      { text: '🚚 Livraison 24h', color: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
    ],
    stats: [
      { n: '94 350+', l: 'Clients satisfaits' },
      { n: '24h', l: 'Livraison Abidjan' },
      { n: '4.9/5', l: 'Note moyenne' },
      { n: '98%', l: 'Recommandent' },
    ],
    problemTitle: 'Vous souffrez de douleurs aux jambes ?',
    problemPoints: [
      { ico: '😣', title: 'Pieds gonfles & douloureux', desc: 'Apres une longue journee debout ou assise, vos pieds et chevilles gonflent et deviennent douloureux.' },
      { ico: '🦵', title: 'Jambes lourdes & fatiguees', desc: 'Sensation de lourdeur, fourmillements, crampes nocturnes. Vos jambes vous ralentissent au quotidien.' },
      { ico: '💔', title: 'Varices & mauvaise circulation', desc: 'Les veines apparentes, le sang qui stagne. Un probleme qui s\'aggrave avec le temps sans traitement.' },
    ],
    solutionTitle: 'La compression graduee qui change tout',
    solutionPoints: [
      {
        ico: '🩺', title: 'Compression medicale 20-30mmHg',
        desc: 'Pression graduee de la cheville vers le mollet. Ameliore la circulation sanguine et reduit les gonflements instantanement.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png',
      },
      {
        ico: '☁️', title: 'Confort toute la journee',
        desc: 'Tissu premium Nylon 65% + Spandex 35%. Respirant, anti-bacterien, anti-odeur. Portez-les 12h sans gene.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png',
      },
      {
        ico: '👟', title: 'Faciles a enfiler',
        desc: 'Contrairement aux autres chaussettes de compression, les notres glissent facilement. Ultra-stretch pour un confort optimal.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png',
      },
      {
        ico: '💪', title: 'Durables & lavables',
        desc: 'Lavables en machine sans perte de qualite ni d\'elasticite. Un investissement durable pour votre sante.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png',
      },
    ],
    comparisonTable: [
      { feature: 'Compression graduee', us: true, them: false },
      { feature: 'Facile a enfiler', us: true, them: false },
      { feature: 'Anti-bacterien', us: true, them: false },
      { feature: 'Adaptee mollets larges', us: true, them: false },
      { feature: 'Lavable en machine', us: true, them: true },
      { feature: 'Respirant toute la journee', us: true, them: false },
      { feature: 'Durable apres 50+ lavages', us: true, them: false },
    ],
    howItWorks: [
      { n: '01', title: 'Enfilez', desc: 'Glissez facilement les chaussettes grace au tissu ultra-stretch.', ico: '🧦' },
      { n: '02', title: 'Compressez', desc: 'La compression graduee stimule votre circulation sanguine.', ico: '💓' },
      { n: '03', title: 'Soulagez', desc: 'Ressentez un soulagement immediat des gonflements et douleurs.', ico: '✨' },
      { n: '04', title: 'Vivez', desc: 'Retrouvez votre mobilite et votre energie toute la journee.', ico: '🚶‍♀️' },
    ],
    faq: [
      { q: 'Combien de temps puis-je les porter ?', a: 'Nos chaussettes sont concues pour etre portees toute la journee, jusqu\'a 12 heures. Retirez-les la nuit sauf avis medical contraire.' },
      { q: 'Conviennent-elles pour le diabete et les varices ?', a: 'Oui ! Elles sont specialement concues pour aider a gerer les symptomes du diabete, des varices et de l\'oedeme. La compression graduee ameliore la circulation sanguine.' },
      { q: 'Dois-je payer avant la livraison ?', a: 'Non. Vous payez uniquement a la reception du produit. Aucun paiement a l\'avance.' },
      { q: 'Sont-elles serrantes ou inconfortables ?', a: 'Non. Contrairement aux autres marques, nos chaussettes offrent une compression douce et confortable. Elles sont faciles a enfiler et ne serrent pas.' },
      { q: 'Comment les entretenir ?', a: 'Lavables en machine a 40°C. Sechage a l\'air libre recommande. Elles gardent leur elasticite meme apres 50+ lavages.' },
      { q: 'Quelle taille choisir ?', a: 'Taille unique extensible qui s\'adapte a la plupart des mollets, y compris les mollets larges. Le tissu ultra-stretch epouse parfaitement votre jambe.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '🩺', t: 'Qualite medicale', d: 'Compression 20-30mmHg' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
      { ico: '🔄', t: 'Echange facile', d: 'Sous 30 jours' },
    ],
  },
  colors: { primary: '#0d9488', accent: '#f59e0b', bg: '#fafaf9' },
  thankYouUrl: '/landing/chaussette-compression/merci',
};

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!res.ok) { console.error('Login failed:', res.status, await res.text()); process.exit(1); }
  return (await res.json()).token;
}

async function run() {
  console.log('Logging in...');
  const token = await login();
  console.log('Logged in. Creating template...');

  const res = await fetch(`${API_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      nom: 'Chaussettes de Compression Anti-Douleur',
      slug: 'chaussette-compression',
      description: 'Page de vente premium chaussettes compression — template V2 Shopify 2026',
      productCode: 'CHAUSSETTE_COMPRESSION_LONG',
      config: JSON.stringify(CONFIG, null, 2),
      assetsFolder: 'chaussette-compression',
      actif: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Create failed:', res.status, body);
    if (res.status === 409) {
      console.log('Template already exists. Trying PUT to update...');
      const listRes = await fetch(`${API_URL}/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
      const list = await listRes.json();
      const existing = (list.templates || []).find(t => t.slug === 'chaussette-compression');
      if (existing) {
        const putRes = await fetch(`${API_URL}/templates/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            nom: 'Chaussettes de Compression Anti-Douleur',
            description: 'Page de vente premium chaussettes compression — template V2 Shopify 2026',
            productCode: 'CHAUSSETTE_COMPRESSION_LONG',
            config: JSON.stringify(CONFIG, null, 2),
            assetsFolder: 'chaussette-compression',
            actif: true,
          }),
        });
        if (putRes.ok) {
          const data = await putRes.json();
          console.log('Template UPDATED:', data.template.nom);
          console.log('URL: https://www.obgestion.com/landing/chaussette-compression');
        } else {
          console.error('Update also failed:', putRes.status, await putRes.text());
        }
      }
    }
    return;
  }

  const data = await res.json();
  console.log('Template CREATED:', data.template.nom);
  console.log('ID:', data.template.id);
  console.log('Slug:', data.template.slug);
  console.log('URL: https://www.obgestion.com/landing/chaussette-compression');
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
