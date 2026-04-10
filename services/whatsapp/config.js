export const WA_CONFIG = {
  provider: process.env.WHATSAPP_PROVIDER || '360DIALOG',
  dialog360: {
    apiKey: process.env.DIALOG360_API_KEY || '',
    apiUrl: process.env.DIALOG360_API_URL || 'https://waba-v2.360dialog.io',
    webhookSecret: process.env.DIALOG360_WEBHOOK_SECRET || '',
  },
  transcription: {
    provider: process.env.TRANSCRIPTION_PROVIDER || 'DEEPGRAM',
    deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  },
  bot: {
    enabled: process.env.WA_BOT_ENABLED !== 'false',
    confidenceThreshold: parseInt(process.env.WA_CONFIDENCE_THRESHOLD) || 40,
    maxBotFailures: parseInt(process.env.WA_MAX_BOT_FAILURES) || 3,
    defaultCompanyId: parseInt(process.env.WA_DEFAULT_COMPANY_ID) || 1,
    businessName: process.env.WA_BUSINESS_NAME || 'OB Gestion',
  },
};

export const INTENTS = {
  GREETING: 'GREETING',
  PRODUCT_QUESTION: 'PRODUCT_QUESTION',
  PRICE_REQUEST: 'PRICE_REQUEST',
  ORDER_START: 'ORDER_START',
  ORDER_CONTINUE: 'ORDER_CONTINUE',
  ORDER_CONFIRM: 'ORDER_CONFIRM',
  ORDER_CANCEL: 'ORDER_CANCEL',
  DELIVERY_QUESTION: 'DELIVERY_QUESTION',
  PAYMENT_QUESTION: 'PAYMENT_QUESTION',
  ORDER_STATUS: 'ORDER_STATUS',
  HUMAN_REQUEST: 'HUMAN_REQUEST',
  COMPLAINT: 'COMPLAINT',
  THANKS: 'THANKS',
  YES: 'YES',
  NO: 'NO',
  PRODUCT_HOWTO: 'PRODUCT_HOWTO',
  PRODUCT_EFFECT: 'PRODUCT_EFFECT',
  PRODUCT_WORKS: 'PRODUCT_WORKS',
  HESITATION: 'HESITATION',
  UNKNOWN: 'UNKNOWN',
};

export const CONV_STATES = {
  NEW: 'NEW',
  GREETING: 'GREETING',
  ASKING_PRODUCT: 'ASKING_PRODUCT',
  ASKING_QUANTITY: 'ASKING_QUANTITY',
  ASKING_NAME: 'ASKING_NAME',
  ASKING_PHONE: 'ASKING_PHONE',
  ASKING_LOCATION: 'ASKING_LOCATION',
  ASKING_ADDRESS: 'ASKING_ADDRESS',
  CONFIRMING_ORDER: 'CONFIRMING_ORDER',
  HUMAN_HANDOFF: 'HUMAN_HANDOFF',
  COMPLETED: 'COMPLETED',
  FAQ: 'FAQ',
};

export const INTENT_PATTERNS = {
  GREETING: [
    /^(bonjour|bonsoir|salut|hello|hi|hey|bjr|cc|coucou|yo|slt)/i,
    /^(bsr|bn|bon ?jour|bon ?soir)/i,
  ],
  PRICE_REQUEST: [
    /(?:combien|prix|cout|co[uû]te?|tarif|cher)/i,
    /(?:c(?:'|')?est (?:combien|à combien))/i,
    /(?:quel (?:est )?(?:le )?prix)/i,
  ],
  ORDER_START: [
    /(?:je (?:veux|voudrais|souhaite|desire) (?:commander|acheter|prendre))/i,
    /(?:commander|acheter|prendre|passer (?:une )?commande)/i,
    /(?:je (?:veux|prends?) (?:un|une|le|la|des|du|[0-9]))/i,
  ],
  ORDER_CONFIRM: [
    /^(oui|yes|ok|d'?accord|daccord|parfait|c'?est bon|validez?|je confirme|exact|bien)/i,
    /(?:valider? ma commande|je confirme|c'?est (?:bon|correct|exact))/i,
  ],
  ORDER_CANCEL: [
    /(?:annuler?|cancel|stop|arr[eê]ter?|non merci|pas int[eé]ress[eé]|laisser? tomber)/i,
  ],
  DELIVERY_QUESTION: [
    /(?:livr(?:aison|er|é)|d[eé]lai|quand|combien de (?:temps|jours))/i,
    /(?:expedition|express|envo[iy])/i,
    /(?:comment (?:est|se fait) la livraison)/i,
  ],
  PAYMENT_QUESTION: [
    /(?:pa(?:ye|ie)(?:ment|r)?|mobile ?money|cash|esp[eè]ces|wave|orange ?money|momo|mtn)/i,
    /(?:comment (?:paye|paie)r|mode de paiement)/i,
  ],
  ORDER_STATUS: [
    /(?:ma commande|mon colis|o[uù] en est|suivi|status|statut)/i,
    /(?:livr[eé] quand|pas (?:encore )?re[cç]u)/i,
  ],
  HUMAN_REQUEST: [
    /(?:parler? [àa] (?:un|quelqu)|humain|agent|personne|responsable|conseiller)/i,
    /(?:je (?:veux|voudrais) (?:parler|discuter))/i,
    /(?:appelez?[- ]?moi|rappel)/i,
  ],
  COMPLAINT: [
    /(?:m[eé]content|plainte|probleme|probl[eè]me|arnaque|escroc|vol[eé])/i,
    /(?:pas (?:satisfait|content)|rembourse|nul|mauvais|horrible)/i,
  ],
  THANKS: [
    /^(merci|thanks|thank|remerci)/i,
  ],
  YES: [
    /^(oui|ouai|wé|ok|yes|yep|d'?accord|daccord|bien s[uû]r|exact|affirmatif|c'?est [çc]a)/i,
  ],
  NO: [
    /^(non|nah|no|pas|nan|jamais|aucun)/i,
  ],
  PRODUCT_QUESTION: [
    /(?:quel(?:s|le)? produit|qu'?(?:est[- ]ce que|avez)[- ]vous|catalogue|gamme|article)/i,
    /(?:[àa] quoi (?:sert|[çc]a sert))/i,
  ],
  PRODUCT_EFFECT: [
    /(?:[çc]a (?:fait|donne) quoi|c'?est quoi|qu'?est[- ]ce que c'?est)/i,
    /(?:effet|r[eé]sultat|(?:il|elle) fait quoi)/i,
    /(?:a quoi [çc]a sert|quoi comme effet)/i,
  ],
  PRODUCT_HOWTO: [
    /(?:comment (?:utiliser?|appliquer?|mettre|s'?en servir|[çc]a s'?utilise|fonctionne))/i,
    /(?:utilisation|mode d'?emploi|application|routine)/i,
  ],
  PRODUCT_WORKS: [
    /(?:est[- ]ce que [çc]a (?:marche|fonctionne|fait effet)|[çc]a marche|efficace)/i,
    /(?:les (?:gens|clients?) (?:disent?|trouvent?)|retour|avis|t[eé]moignage)/i,
    /(?:vraiment|s[eé]rieux|fiable|qualit[eé])/i,
  ],
  HESITATION: [
    /(?:je sais pas|j'?h[eé]site|pas s[uû]r|je r[eé]fl[eé]chi|peut[- ]?[eê]tre|je ne sais)/i,
    /(?:c'?est (?:s[uû]r|garanti|vrai)|[çc]a vaut (?:le coup|la peine))/i,
  ],
};

export const PRODUCT_SYNONYMS = {
  creme_minceur: ['creme minceur', 'crème minceur', 'brule graisse', 'brûle graisse', 'creme brule graisse', 'crème brûle graisse', 'minceur', 'mincir', 'maigrir', 'ventre plat', 'graisse ventre', 'perdre du ventre', 'amincissant'],
  gaine: ['gaine', 'ceinture', 'tourmaline', 'chauffante'],
  creme_anti_cerne: ['anti cerne', 'anticerne', 'cerne', 'yeux', 'poches'],
  creme_anti_verrues: ['verrue', 'anti verrue', 'antiverrue'],
  creme_anti_lipome: ['lipome', 'anti lipome', 'antilipome', 'boule sous la peau', 'kyste'],
  serum_ongle: ['ongle', 'serum ongle', 'ongles', 'mycose'],
  poudre_cheveux: ['cheveux', 'poudre', 'pousse', 'pousse cheveux', 'calvitie', 'chute cheveux'],
  spray_douleur: ['douleur', 'spray', 'anti douleur', 'antidouleur', 'mal', 'articulation'],
  patch_minceur: ['patch', 'patch minceur', 'amincissant patch'],
  chaussette: ['chaussette', 'compression', 'pieds'],
  creme_tache: ['tache', 'anti tache', 'antitache', 'peau claire', 'eclaircir'],
  creme_vitiligo: ['vitiligo', 'depigmentation', 'tache blanche'],
  creme_hemorroide: ['hemorroide', 'hemoroide', 'hemorrhoide'],
  levre_rose: ['levre', 'levres', 'rose', 'levre rose'],
  spray_minceur: ['spray minceur', 'bruleur graisse spray'],
  semelle: ['semelle', 'massante', 'pied'],
  blanchiment: ['dent', 'dentaire', 'blanchiment', 'v34'],
  lunette: ['lunette', 'vision', 'nocturne', 'nuit'],
  pads_poitrine: ['poitrine', 'sein', 'rehausseur', 'pads'],
};

export const PRODUCT_KNOWLEDGE = {
  creme_minceur: {
    displayName: 'Crème Minceur',
    productKey: 'CREME_MINCEUR',
    webhookLabel: 'creme minceur',
    pricing: { 1: 9900, 2: 16900, 3: 24900 },
    faq: {
      effect: [
        "La Crème Minceur est conçue pour accompagner visuellement l'affinement de la silhouette, surtout au niveau du ventre et des zones ciblées. Beaucoup de clientes apprécient son effet chauffant et son application simple.",
        "C'est une crème minceur utilisée dans la routine beauté pour aider à améliorer visuellement certaines zones localisées. Son effet chauffant et sa texture sont très appréciés.",
        "C'est un produit de soin ciblé qui accompagne l'affinement visuel de la silhouette. L'effet chauffant est particulièrement apprécié par nos clientes.",
      ],
      howto: [
        "L'application est simple. Il suffit de l'utiliser régulièrement sur la zone concernée selon la routine prévue pour le produit.",
        "C'est un produit facile à intégrer dans votre routine. L'essentiel est une utilisation régulière sur la zone ciblée.",
        "Rien de compliqué : appliquez la crème sur la zone souhaitée, en particulier le ventre, de manière régulière pour de meilleurs résultats visuels.",
      ],
      works: [
        "Beaucoup de clientes nous font de très bons retours sur la sensation, l'application et l'amélioration visuelle de la silhouette. Les résultats peuvent varier selon l'utilisation et la régularité.",
        "Nous avons de très bons retours clients. Plusieurs apprécient l'effet chauffant et le rendu visuel sur la silhouette avec une utilisation régulière.",
        "Nos clientes nous donnent d'excellents retours. Le produit est apprécié pour son effet chauffant agréable et l'amélioration visuelle constatée sur la silhouette.",
      ],
      hesitation: [
        "Je comprends tout à fait. C'est justement pour cela que beaucoup de clientes commencent par essayer 1 paquet, puis reviennent ensuite.",
        "Je comprends votre hésitation. Le produit plaît beaucoup pour son application simple et sa sensation agréable sur la peau.",
        "C'est tout à fait normal d'hésiter. Sachez que nous avons beaucoup de clientes satisfaites, et vous pouvez commencer avec 1 seul paquet pour tester.",
      ],
    },
  },
};

export const CITY_PATTERNS = [
  'abidjan', 'bouake', 'daloa', 'yamoussoukro', 'san pedro', 'korhogo',
  'man', 'gagnoa', 'soubre', 'divo', 'duekoue', 'abengourou',
  'agboville', 'grand bassam', 'bingerville', 'anyama', 'dabou',
  'issia', 'guiglo', 'bondoukou', 'ferkessedougou', 'odienne',
  'sinfra', 'katiola', 'bouna', 'beoumi', 'seguela', 'sassandra',
  'toumodi', 'tanda', 'dimbokro', 'bouafle', 'tiassale',
  'yopougon', 'cocody', 'marcory', 'treichville', 'adjame', 'abobo',
  'plateau', 'port bouet', 'koumassi', 'riviera', 'angre',
  'ouagadougou', 'bobo dioulasso', 'koudougou', 'banfora',
];
