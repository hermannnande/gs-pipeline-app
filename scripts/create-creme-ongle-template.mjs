const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const CONFIG = {
  templateVersion: 2,
  productCode: 'CREME_ONGLE_INCARNE',
  title: 'Creme Anti-Ongle Incarne',
  subtitle: 'Traitement professionnel en 7 jours',
  description: 'Fini les douleurs d\'ongles incarnes, les inflammations et les orteils douloureux. Notre creme penetrante soulage des la 1ere application et corrige l\'ongle en 7 jours. Formule naturelle approuvee par les podologues.',
  badge: 'N°1 EN CI',
  prices: { 1: 9900, 2: 16900, 3: 24900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 boite', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 boites', sub: '16 900 FCFA', tag: 'Populaire', save: 'Economisez 2 900 F' },
    { v: 3, label: '3 boites', sub: '24 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 4 800 F' },
  ],
  images: {
    hero: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
    gallery: [
      'https://obrille.com/wp-content/uploads/2026/04/Sans-titre-2026-04-14-19-03-03copy.mp4',
      'https://obrille.com/wp-content/uploads/2026/04/gi-vd-15-20230718115319-3q2eg.gif',
      'https://obrille.com/wp-content/uploads/2026/04/gif-vd16-20230718120218-nfxqu.gif',
      'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
      'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
    ],
    lifestyle: [
      'https://obrille.com/wp-content/uploads/2026/04/Clou-casse-et-peau-seche.png',
      'https://obrille.com/wp-content/uploads/2026/04/Ongle-incarne-avec-inflammation-rougeatre.png',
      'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
    ],
    trustStrip: [
      'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
      'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
      'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
    ],
  },
  reviews: [
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
      n: 'Adjoua M.', v: 'Abidjan — Cocody',
      q: 'Mon ongle incarne me faisait souffrir depuis 3 mois. J\'avais peur de me faire operer. Avec cette creme en seulement 5 jours l\'ongle a commence a se redresser. Plus aucune douleur aujourd\'hui !',
      s: 5, verified: true, date: 'Il y a 2 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
      n: 'Koffi T.', v: 'Yopougon',
      q: 'Je ne pouvais plus porter de chaussures fermees a cause de mon gros orteil. Apres 1 semaine de creme, l\'inflammation a completement disparu. Je marche normalement maintenant.',
      s: 5, verified: true, date: 'Il y a 5 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
      n: 'Mariame C.', v: 'Marcory',
      q: 'Ma fille de 14 ans avait un ongle incarne tres douloureux. Le medecin voulait operer. On a essaye cette creme d\'abord et en 10 jours tout etait regle. Merci infiniment !',
      s: 5, verified: true, date: 'Il y a 1 semaine',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Clou-casse-et-peau-seche.png',
      n: 'Ibrahim D.', v: 'Plateau',
      q: 'Je suis footballeur et mes orteils souffrent beaucoup. Cette creme a sauve mon gros orteil. Application facile, pas de douleur pendant le traitement. Je recommande a tous les sportifs.',
      s: 5, verified: true, date: 'Il y a 3 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
      n: 'Awa B.', v: 'Treichville',
      q: 'J\'ai teste beaucoup de remedes maison sans succes. Cette creme est la seule qui a vraiment fonctionne. L\'ongle pousse maintenant correctement. Fini la douleur a chaque pas !',
      s: 5, verified: true, date: 'Il y a 4 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Ongle-incarne-avec-inflammation-rougeatre.png',
      n: 'Sekou K.', v: 'Bouake',
      q: 'Mon ongle etait infecte et rouge. J\'avais tres mal. Des la 2eme application l\'inflammation a diminue. Apres 7 jours c\'etait comme neuf. Produit miraculeux.',
      s: 5, verified: true, date: 'Il y a 6 jours',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
      n: 'Fatimata S.', v: 'Abobo',
      q: 'Je travaille debout toute la journee. Mon ongle incarne etait un calvaire. Apres le traitement je peux enfin remettre mes belles chaussures. Le resultat est bluffant.',
      s: 5, verified: true, date: 'Il y a 1 semaine',
    },
    {
      img: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
      n: 'Yves A.', v: 'Cocody',
      q: 'Ma mere de 65 ans souffrait de ses ongles depuis des annees. On lui a offert cette creme et elle revit. Elle dit que c\'est le meilleur cadeau qu\'on lui a fait.',
      s: 5, verified: true, date: 'Il y a 2 semaines',
    },
  ],
  toasts: [
    { n: 'Adjoua M.', v: 'Cocody', t: '3 min' },
    { n: 'Koffi T.', v: 'Yopougon', t: '7 min' },
    { n: 'Mariame C.', v: 'Marcory', t: '12 min' },
    { n: 'Ibrahim D.', v: 'Plateau', t: '18 min' },
    { n: 'Sekou K.', v: 'Bouake', t: '25 min' },
  ],
  bundles: [
    {
      v: 1, label: '1 boite', unitPrice: 9900, totalPrice: 9900,
      perDay: 'Traitement 1 pied',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
    },
    {
      v: 2, label: '2 boites', unitPrice: 8450, totalPrice: 16900,
      save: 'Economisez 2 900 F', tag: 'POPULAIRE',
      perDay: 'Traitement complet 2 pieds',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
    },
    {
      v: 3, label: '3 boites', unitPrice: 8300, totalPrice: 24900,
      save: 'Economisez 4 800 F', tag: 'CURE COMPLETE',
      perDay: 'Traitement famille entiere',
      img: 'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
    },
  ],
  sections: {
    marqueeTexts: [
      'Soulagement des la 1ere application',
      'Formule approuvee par les podologues',
      'Livraison 24h Abidjan',
      'Paiement a la livraison',
      'Resultat visible en 7 jours',
      '+38 000 ongles sauves',
    ],
    stickers: [
      { text: '🏥 Approuve par les podologues', color: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
      { text: '⚡ Resultat en 7 jours', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
      { text: '🌿 100% Naturel', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
    ],
    stats: [
      { n: '38 200+', l: 'Ongles traites' },
      { n: '7 jours', l: 'Resultat visible' },
      { n: '4.8/5', l: 'Note moyenne' },
      { n: '97%', l: 'Satisfaits' },
    ],
    problemTitle: 'Vous souffrez d\'ongles incarnes ?',
    problemPoints: [
      { ico: '😖', title: 'Douleur insupportable', desc: 'Chaque pas est une torture. L\'ongle s\'enfonce dans la chair et provoque une douleur lancinante a chaque mouvement.' },
      { ico: '🦶', title: 'Inflammation & infection', desc: 'Rougeur, gonflement, pus... L\'ongle incarne non traite peut s\'infecter et s\'aggraver rapidement.' },
      { ico: '👟', title: 'Impossible de se chausser', desc: 'Porter des chaussures fermees devient impossible. Meme les sandales appuient sur la zone douloureuse.' },
    ],
    solutionTitle: 'Le traitement qui change tout en 7 jours',
    solutionPoints: [
      {
        ico: '💧', title: 'Formule penetrante rapide',
        desc: 'Notre creme adoucit la peau et l\'ongle des la premiere application. La douleur diminue en quelques heures.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Traitement-efficace-des-ongles-incarnes.png',
      },
      {
        ico: '🔄', title: 'Corrige la pousse de l\'ongle',
        desc: 'La formule agit en profondeur pour rediriger la croissance de l\'ongle. Fini l\'ongle qui s\'enfonce dans la chair.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Comparaison-avant-apres-dun-ongle-incarne.png',
      },
      {
        ico: '🛡️', title: 'Anti-inflammatoire naturel',
        desc: 'Reduit l\'inflammation, la rougeur et le gonflement rapidement. Ingredients naturels sans effets secondaires.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Soulagement-rapide-des-ongles-incarnes.png',
      },
      {
        ico: '🌿', title: 'Sans chirurgie ni douleur',
        desc: 'Evitez l\'operation couteuse et douloureuse. Notre traitement topique est indolore et se fait confortablement chez vous.',
        img: 'https://obrille.com/wp-content/uploads/2026/04/Clou-casse-et-peau-seche.png',
      },
    ],
    comparisonTable: [
      { feature: 'Sans douleur', us: true, them: false },
      { feature: 'Sans chirurgie', us: true, them: false },
      { feature: 'Resultat en 7 jours', us: true, them: false },
      { feature: 'Ingredients naturels', us: true, them: false },
      { feature: 'Application facile', us: true, them: true },
      { feature: 'Previent la recidive', us: true, them: false },
      { feature: 'Prix abordable', us: true, them: false },
    ],
    howItWorks: [
      { n: '01', title: 'Nettoyez', desc: 'Lavez et sechez bien le pied affecte avant l\'application.', ico: '🧼' },
      { n: '02', title: 'Appliquez', desc: 'Appliquez une noisette de creme sur l\'ongle incarne et la zone enflammee.', ico: '💧' },
      { n: '03', title: 'Massez', desc: 'Massez doucement pendant 30 secondes pour faire penetrer le produit.', ico: '👆' },
      { n: '04', title: 'Guerissez', desc: 'Repetez 2x par jour. Resultat visible des le 3eme jour.', ico: '✨' },
    ],
    faq: [
      { q: 'Combien de temps avant de voir un resultat ?', a: 'La douleur diminue des la 1ere application. L\'amelioration visible commence au 3eme jour. L\'ongle se corrige completement en 7 a 14 jours selon la gravite.' },
      { q: 'Est-ce que ca fait mal a l\'application ?', a: 'Pas du tout ! La creme est douce et apaisante. Vous ressentirez meme un soulagement immediat de la douleur des la premiere utilisation.' },
      { q: 'Ca marche sur les ongles tres incarnes ?', a: 'Oui, notre formule est concue pour tous les stades d\'ongles incarnes, des cas legers aux cas avances avec inflammation. Pour les cas tres severes avec infection, consultez un medecin en parallele.' },
      { q: 'Dois-je payer avant la livraison ?', a: 'Non ! Vous payez uniquement a la reception du produit, en especes, au livreur. Aucun paiement en ligne requis.' },
      { q: 'Combien de tubes faut-il pour un traitement complet ?', a: '1 tube suffit pour traiter un pied pendant 2 a 3 semaines. Pour les deux pieds ou un traitement prolonge, nous recommandons 2 tubes.' },
      { q: 'Y a-t-il des effets secondaires ?', a: 'Non. Notre formule est 100% naturelle et testee dermatologiquement. Aucun effet secondaire rapporte par nos +38 000 clients.' },
    ],
    trustBadges: [
      { ico: '🚚', t: 'Livraison rapide', d: '24h Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Aucun risque' },
      { ico: '🏥', t: 'Approuve', d: 'Par les podologues' },
      { ico: '📞', t: 'Support client', d: '7j/7' },
      { ico: '🔄', t: 'Satisfait ou rembourse', d: 'Sous 30 jours' },
    ],
    finalCtaTitle: 'Liberez-vous de la douleur des ongles incarnes',
    finalCtaSub: 'Rejoignez +38 000 personnes qui ont dit adieu aux ongles douloureux',
  },
  colors: { primary: '#7c3aed', accent: '#a855f7', bg: '#faf9fb' },
  thankYouUrl: '/landing/creme-ongle-incarne/merci',
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

  const payload = {
    nom: 'Creme Anti-Ongle Incarne',
    slug: 'creme-ongle-incarne',
    description: 'Page de vente premium creme ongle incarne — template V2 violet',
    productCode: 'CREME_ONGLE_INCARNE',
    config: JSON.stringify(CONFIG, null, 2),
    assetsFolder: 'creme-ongle-incarne',
    actif: true,
  };

  const res = await fetch(`${API_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Create failed:', res.status, body);
    if (res.status === 409) {
      console.log('Template already exists. Trying PUT to update...');
      const listRes = await fetch(`${API_URL}/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
      const list = await listRes.json();
      const existing = (list.templates || []).find(t => t.slug === 'creme-ongle-incarne');
      if (existing) {
        const putRes = await fetch(`${API_URL}/templates/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (putRes.ok) {
          const data = await putRes.json();
          console.log('Template UPDATED:', data.template.nom);
          console.log('URL: https://www.obgestion.com/landing/creme-ongle-incarne');
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
  console.log('URL: https://www.obgestion.com/landing/creme-ongle-incarne');
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
