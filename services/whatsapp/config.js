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
    /(?:[àa] quoi (?:sert|[çc]a sert)|comment (?:utiliser|fonctionne)|effet|r[eé]sultat)/i,
  ],
};

export const PRODUCT_SYNONYMS = {
  gaine: ['gaine', 'ceinture', 'minceur', 'tourmaline', 'chauffante'],
  creme_anti_cerne: ['anti cerne', 'anticerne', 'cerne', 'yeux', 'poches'],
  creme_anti_verrues: ['verrue', 'anti verrue', 'antiverrue'],
  creme_anti_lipome: ['lipome', 'anti lipome', 'antilipome', 'boule sous la peau', 'kyste'],
  serum_ongle: ['ongle', 'serum ongle', 'ongles', 'mycose'],
  poudre_cheveux: ['cheveux', 'poudre', 'pousse', 'pousse cheveux', 'calvitie', 'chute cheveux'],
  spray_douleur: ['douleur', 'spray', 'anti douleur', 'antidouleur', 'mal', 'articulation'],
  patch_minceur: ['patch', 'minceur', 'ventre plat', 'amincissant'],
  chaussette: ['chaussette', 'compression', 'chauffante', 'pieds'],
  creme_tache: ['tache', 'anti tache', 'antitache', 'peau claire', 'eclaircir'],
  creme_vitiligo: ['vitiligo', 'depigmentation', 'tache blanche'],
  creme_hemorroide: ['hemorroide', 'hemoroide', 'hemorrhoide'],
  levre_rose: ['levre', 'levres', 'rose', 'levre rose'],
  spray_minceur: ['spray minceur', 'bruleur graisse'],
  semelle: ['semelle', 'massante', 'pied'],
  blanchiment: ['dent', 'dentaire', 'blanchiment', 'v34'],
  lunette: ['lunette', 'vision', 'nocturne', 'nuit'],
  pads_poitrine: ['poitrine', 'sein', 'rehausseur', 'pads'],
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
