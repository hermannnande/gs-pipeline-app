const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

const IMG = 'https://obrille.com/wp-content/uploads/2026/04/';

const CONFIG = {
  templateVersion: 2,
  productCode: 'CREME_ANTI_VERRUES',
  title: 'Creme Eliminatrice de Verrues',
  subtitle: 'Traitement professionnel — resultats en 7 jours',
  description: 'Eliminez definitivement les verrues, cors et callosites sans douleur. Notre formule concentree a base d\'ingredients naturels penetre en profondeur pour detruire la racine de la verrue. Resultats visibles des les premiers jours — peau nette et lisse retrouvee.',
  badge: 'N°1 EN CI',
  prices: { 1: 9900, 2: 14900, 3: 19900 },
  oldPrice: 15000,
  discount: '-34%',
  qtyOptions: [
    { v: 1, label: '1 tube', sub: '9 900 FCFA', save: '' },
    { v: 2, label: '2 tubes', sub: '14 900 FCFA', tag: 'Populaire', save: 'Economisez 4 900 F' },
    { v: 3, label: '3 tubes', sub: '19 900 FCFA', tag: 'Meilleure offre', save: 'Economisez 9 800 F' },
  ],
  images: {
    hero: IMG + 'ChatGPT-Image-15-avr.-2026-10_11_48.png',
    gallery: [
      IMG + 'ChatGPT-Image-15-avr.-2026-10_04_54.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_10_03.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_05_14.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_11_43.png',
      IMG + 'Sans-titre-2026-04-14-19-03-03copy-2026-04-14-20-47-10copy.mp4',
    ],
    lifestyle: [
      IMG + 'ChatGPT-Image-15-avr.-2026-10_05_28-1.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_14_51.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_20_15.png',
    ],
    trustStrip: [
      IMG + 'ChatGPT-Image-15-avr.-2026-10_11_48.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_04_54.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_10_03.png',
      IMG + 'ChatGPT-Image-15-avr.-2026-10_11_43.png',
    ],
  },
  reviews: [
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_05_14.png',
      n: 'Adjoua M.', v: 'Abidjan — Cocody',
      q: 'J\'avais des verrues sur le visage depuis 3 ans. J\'ai tout essaye sans succes. Avec cette creme, en 10 jours tout etait parti. Ma peau est redevenue nette. Je recommande a 100%.',
      s: 5, verified: true, date: 'Il y a 2 jours',
    },
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_07_50.png',
      n: 'Fatou K.', v: 'Yopougon',
      q: 'Les verrues dans mon cou me genaient beaucoup. Ma soeur m\'a recommande cette creme. En une semaine, les verrues ont seche et sont tombees. Peau propre comme avant !',
      s: 5, verified: true, date: 'Il y a 5 jours',
    },
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_09_09.png',
      n: 'Ibrahim T.', v: 'Marcory',
      q: 'Mes mains etaient couvertes de verrues, j\'avais honte de serrer la main des gens. Cette creme a tout enleve proprement, sans douleur. Resultat incroyable en 2 semaines.',
      s: 5, verified: true, date: 'Il y a 1 semaine',
    },
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_04_54.png',
      n: 'Mariam D.', v: 'Abobo',
      q: 'Ma fille de 14 ans avait des verrues au visage. On a essaye le dermatologue, rien. Avec cette creme en seulement 8 jours, les verrues ont disparu completement. Merci infiniment.',
      s: 5, verified: true, date: 'Il y a 3 jours',
    },
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_11_48.png',
      n: 'Kouame A.', v: 'Bouake',
      q: 'J\'ai commande 2 tubes pour moi et ma femme. On avait des verrues sur le corps depuis des annees. Apres le traitement, peau nette ! Le produit est tres efficace.',
      s: 5, verified: true, date: 'Il y a 4 jours',
    },
    {
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_10_03.png',
      n: 'Awa S.', v: 'Treichville',
      q: 'Je suis estheticienne et je recommande cette creme a mes clientes. Les resultats sont impressionnants. Les verrues sechent et tombent sans laisser de cicatrice.',
      s: 5, verified: true, date: 'Il y a 6 jours',
    },
  ],
  toasts: [
    { n: 'Adjoua M.', v: 'Cocody', t: '3 min' },
    { n: 'Fatou K.', v: 'Yopougon', t: '7 min' },
    { n: 'Ibrahim T.', v: 'Marcory', t: '12 min' },
    { n: 'Mariam D.', v: 'Abobo', t: '18 min' },
    { n: 'Kouame A.', v: 'Bouake', t: '22 min' },
    { n: 'Awa S.', v: 'Treichville', t: '25 min' },
    { n: 'Celine B.', v: 'Plateau', t: '30 min' },
    { n: 'Drissa O.', v: 'Adjame', t: '35 min' },
  ],
  bundles: [
    {
      v: 1,
      label: '1 Tube — Essai',
      unitPrice: 9900,
      totalPrice: 9900,
      perDay: 'Soit 330 F / jour pendant 30 jours',
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_11_48.png',
    },
    {
      v: 2,
      label: '2 Tubes — Traitement complet',
      unitPrice: 7450,
      totalPrice: 14900,
      save: 'Economisez 4 900 FCFA',
      tag: 'POPULAIRE',
      perDay: 'Soit 248 F / jour',
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_04_54.png',
    },
    {
      v: 3,
      label: '3 Tubes — Pack famille',
      unitPrice: 6633,
      totalPrice: 19900,
      save: 'Economisez 9 800 FCFA',
      tag: 'MEILLEURE OFFRE',
      perDay: 'Soit 221 F / jour',
      img: IMG + 'ChatGPT-Image-15-avr.-2026-10_10_03.png',
    },
  ],
  sections: {
    marqueeTexts: [
      'Elimine les verrues en 7 jours',
      'Formule a base d\'ingredients naturels',
      'Livraison GRATUITE 24h Abidjan',
      'Paiement a la livraison',
      '+12 000 clients satisfaits',
      'Approuve par les dermatologues',
    ],
    problemTitle: 'Les verrues vous genent au quotidien ?',
    problemPoints: [
      {
        ico: '😰',
        title: 'Apparence genante',
        desc: 'Les verrues sur le visage, le cou ou les mains affectent votre confiance et votre estime de soi. Vous evitez les regards et les contacts.',
      },
      {
        ico: '🔄',
        title: 'Multiplication rapide',
        desc: 'Sans traitement, les verrues se multiplient et se propagent sur d\'autres parties du corps. Plus vous attendez, plus c\'est difficile.',
      },
      {
        ico: '💊',
        title: 'Traitements inefficaces',
        desc: 'Dermatologues couteux, remedes maison sans effet, produits chimiques agressifs... Vous avez tout essaye sans resultats durables.',
      },
    ],
    solutionTitle: 'La creme qui elimine les verrues definitivement',
    solutionPoints: [
      {
        ico: '🎯',
        title: 'Action ciblee sur la racine',
        desc: 'Notre formule penetre en profondeur pour detruire la racine de la verrue, pas seulement la surface. Elimination definitive sans recidive.',
        img: IMG + 'ChatGPT-Image-15-avr.-2026-10_11_48.png',
      },
      {
        ico: '🌿',
        title: 'Ingredients 100% naturels',
        desc: 'Formule douce a base d\'extraits naturels. Pas de brulure chimique, pas d\'irritation. Convient a toutes les peaux, meme sensibles.',
        img: IMG + 'ChatGPT-Image-15-avr.-2026-10_11_43.png',
      },
      {
        ico: '⚡',
        title: 'Resultats visibles en 7 jours',
        desc: 'Des la premiere application, la verrue commence a secher. En 7 a 14 jours, elle tombe naturellement sans laisser de cicatrice.',
        img: IMG + 'ChatGPT-Image-15-avr.-2026-10_09_09.png',
      },
      {
        ico: '🛡️',
        title: 'Sans douleur et sans cicatrice',
        desc: 'Contrairement a la chirurgie ou la cryotherapie, notre creme agit en douceur. Application simple et indolore, peau nette garantie.',
        img: IMG + 'ChatGPT-Image-15-avr.-2026-10_05_14.png',
      },
    ],
    howItWorks: [
      { n: '1', title: 'Nettoyez la zone', desc: 'Lavez et sechez soigneusement la zone affectee par les verrues.', ico: '🧼' },
      { n: '2', title: 'Appliquez la creme', desc: 'Deposez une fine couche de creme directement sur chaque verrue, 2 fois par jour.', ico: '💧' },
      { n: '3', title: 'Laissez agir', desc: 'La creme penetre et detruit la racine. La verrue commence a secher des les premiers jours.', ico: '⏳' },
      { n: '4', title: 'Verrue eliminee', desc: 'En 7 a 14 jours, la verrue seche et tombe naturellement. Votre peau retrouve sa nettete.', ico: '✨' },
    ],
    comparisonTable: [
      { feature: 'Elimine la racine', us: true, them: false },
      { feature: 'Sans douleur', us: true, them: false },
      { feature: 'Ingredients naturels', us: true, them: false },
      { feature: 'Resultats en 7 jours', us: true, them: false },
      { feature: 'Sans cicatrice', us: true, them: false },
      { feature: 'Prix abordable', us: true, them: false },
      { feature: 'Applicable a la maison', us: true, them: true },
    ],
    stats: [
      { n: '12 847', l: 'Clients satisfaits' },
      { n: '98%', l: 'Taux de reussite' },
      { n: '7-14j', l: 'Resultats visibles' },
      { n: '4.9/5', l: 'Note moyenne' },
    ],
    faq: [
      {
        q: 'La creme fonctionne-t-elle vraiment sur tous les types de verrues ?',
        a: 'Oui, notre creme est efficace sur les verrues vulgaires, planes, filiformes et plantaires. Elle agit sur la racine de la verrue, quel que soit son type ou son emplacement sur le corps.',
      },
      {
        q: 'Combien de temps faut-il pour voir les resultats ?',
        a: 'Les premiers resultats sont visibles des 3 a 5 jours d\'application. La verrue commence a secher et tombe generalement entre 7 et 14 jours. Les cas plus anciens peuvent necessiter 2 a 3 semaines.',
      },
      {
        q: 'Est-ce que la creme est douloureuse ?',
        a: 'Non, l\'application est totalement indolore. La creme a une formule douce qui n\'irrite pas la peau. Vous pouvez ressentir un leger picotement les premieres secondes, signe que le produit agit.',
      },
      {
        q: 'Est-ce que les verrues peuvent revenir apres le traitement ?',
        a: 'Notre creme detruit la verrue depuis sa racine, ce qui reduit considerablement le risque de recidive. Nous recommandons d\'utiliser le tube en entier pour un traitement complet.',
      },
      {
        q: 'Puis-je utiliser la creme sur le visage ?',
        a: 'Oui, notre formule douce est compatible avec toutes les zones du corps, y compris le visage et le cou. Evitez simplement le contour des yeux et les muqueuses.',
      },
      {
        q: 'Comment se passe la livraison et le paiement ?',
        a: 'Livraison gratuite en 24h a Abidjan et environs. Vous payez uniquement a la reception de votre colis. Aucun paiement a l\'avance n\'est requis.',
      },
      {
        q: 'Un tube suffit-il pour traiter plusieurs verrues ?',
        a: 'Un tube suffit pour traiter 5 a 10 verrues de taille moyenne. Pour les cas plus etendus ou un traitement familial, nous recommandons le pack de 2 ou 3 tubes.',
      },
    ],
    trustBadges: [
      { ico: '🌿', t: 'Ingredients naturels', d: 'Formule douce et sure' },
      { ico: '🚚', t: 'Livraison 24h', d: 'Gratuite a Abidjan' },
      { ico: '💰', t: 'Paiement livraison', d: 'Zero risque' },
      { ico: '✅', t: '98% d\'efficacite', d: 'Prouve cliniquement' },
      { ico: '📞', t: 'Support 7j/7', d: 'Equipe disponible' },
    ],
    stickers: [
      { text: '🔥 BEST-SELLER 2026', color: 'bg-red-100 text-red-700' },
      { text: '🌿 NATUREL', color: 'bg-emerald-100 text-emerald-700' },
      { text: '⚡ RESULTATS 7 JOURS', color: 'bg-blue-100 text-blue-700' },
      { text: '✅ APPROUVE DERMATO', color: 'bg-purple-100 text-purple-700' },
    ],
    finalCtaTitle: 'Retrouvez une peau nette et sans verrues',
    finalCtaSub: 'Rejoignez les +12 000 clients qui ont dit adieu aux verrues definitivement',
  },
  colors: {
    primary: '#1e6bb8',
    accent: '#0891b2',
    bg: '#fafaf9',
  },
  thankYouUrl: '/landing/creme-verrue-tk/merci',
};

const PAYLOAD = {
  nom: 'Creme Eliminatrice de Verrues — V2',
  slug: 'creme-verrue-tk',
  description: 'Landing page V2 premium pour la creme anti-verrues',
  productCode: 'CREME_ANTI_VERRUES',
  config: JSON.stringify(CONFIG),
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
  console.log('OK\n');

  console.log('Creating template...');
  const res = await fetch(`${API_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(PAYLOAD),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Create failed:', res.status, body);

    if (res.status === 409) {
      console.log('Template already exists. Trying PUT to update...');
      const listRes = await fetch(`${API_URL}/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
      const list = await listRes.json();
      const existing = (list.templates || []).find(t => t.slug === 'creme-verrue-tk');
      if (existing) {
        const putRes = await fetch(`${API_URL}/templates/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(PAYLOAD),
        });
        if (putRes.ok) {
          const data = await putRes.json();
          console.log('Template UPDATED:', data.template.nom);
          console.log('URL: https://www.obgestion.com/landing/creme-verrue-tk');
          console.log('Thank You: https://www.obgestion.com/landing/creme-verrue-tk/merci');
        } else {
          console.error('Update failed:', putRes.status, await putRes.text());
        }
      }
    }
    return;
  }

  const data = await res.json();
  console.log('Template CREATED:', data.template.nom);
  console.log('ID:', data.template.id);
  console.log('Slug:', data.template.slug);
  console.log('URL: https://www.obgestion.com/landing/creme-verrue-tk');
  console.log('Thank You: https://www.obgestion.com/landing/creme-verrue-tk/merci');
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
