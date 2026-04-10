import { WA_CONFIG, PRODUCT_KNOWLEDGE } from './config.js';

const BIZ = WA_CONFIG.bot.businessName;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Fr';
}

export const TEMPLATES = {
  welcome: () => pick([
    `Bonjour 👋 Bienvenue chez ${BIZ}. Quel produit vous intéresse ?`,
    `Bonjour 😊 Merci de nous avoir contactés. Dites-moi le produit qui vous intéresse et je vous donne immédiatement les informations.`,
    `Bonjour. Je suis là pour vous aider. Quel produit souhaitez-vous commander ?`,
    `Bonjour 👋 Bienvenue. Comment puis-je vous aider aujourd'hui ?`,
    `Bonsoir 😊 Ravi de vous accueillir chez ${BIZ}. Quel produit vous intéresse ?`,
  ]),

  welcomeBack: (name) => pick([
    `Rebonjour${name ? ' ' + name : ''} 😊 Comment puis-je vous aider ?`,
    `Content de vous revoir${name ? ' ' + name : ''} ! Que puis-je faire pour vous ?`,
    `Bonjour${name ? ' ' + name : ''} 👋 Vous souhaitez passer une nouvelle commande ?`,
  ]),

  askProduct: () => pick([
    `Quel produit vous intéresse ? Je vous accompagne avec plaisir pour trouver l'offre qui vous convient.`,
    `Parfait, je vous accompagne pour la commande. Quel produit souhaitez-vous pour votre bien-être ?`,
    `Très bien. Dites-moi le produit qui vous intéresse s'il vous plaît.`,
    `D'accord. Quel produit souhaitez-vous commander aujourd'hui ?`,
  ]),

  productInfo: (product) => {
    const pk = findProductKnowledge(product.nom);
    if (pk) {
      const p = pk.pricing;
      return pick([
        `La *${pk.displayName}* est disponible :\n\n📦 1 paquet : ${formatPrice(p[1])}\n📦 2 paquets : ${formatPrice(p[2])}\n📦 3 paquets : ${formatPrice(p[3])}\n\nC'est un produit très apprécié pour accompagner visuellement la silhouette. Combien de paquets souhaitez-vous prendre ?`,
        `Nous avons la *${pk.displayName}* avec 3 offres :\n\n• 1 paquet à ${formatPrice(p[1])}\n• 2 paquets à ${formatPrice(p[2])}\n• 3 paquets à ${formatPrice(p[3])}\n\nBeaucoup de clientes apprécient son application simple et son effet chauffant. Quelle offre vous convient ?`,
        `Pour la *${pk.displayName}* :\n• ${formatPrice(p[1])} le paquet\n• ${formatPrice(p[2])} les 2 paquets\n• ${formatPrice(p[3])} les 3 paquets\n\nVous souhaitez 1, 2 ou 3 paquets ? Je peux vous aider à choisir selon votre objectif.`,
      ]);
    }
    return `*${product.nom}*\n💰 Prix : ${formatPrice(product.prixUnitaire)}${product.prix2Unites ? '\n📦 2 unités : ' + formatPrice(product.prix2Unites) : ''}${product.prix3Unites ? '\n📦 3 unités : ' + formatPrice(product.prix3Unites) : ''}\n\nSouhaitez-vous commander ce produit ?`;
  },

  productNotFound: () => pick([
    `Je n'ai pas trouvé ce produit. Pouvez-vous reformuler ou me donner plus de détails ?`,
    `Dites-moi le nom du produit qui vous intéresse s'il vous plaît.`,
    `Je veux être sûr de bien vous orienter. Confirmez-moi le produit souhaité.`,
  ]),

  askQuantity: (productName) => pick([
    `Parfait. Combien de paquets de *${productName}* souhaitez-vous prendre ?`,
    `D'accord. Vous souhaitez 1, 2 ou 3 paquets ?`,
    `Très bien. Quelle offre vous convient : 1 paquet, 2 paquets ou 3 paquets ?`,
    `Combien de *${productName}* souhaitez-vous commander ?`,
  ]),

  askCity: () => pick([
    `Merci ! Dans quelle ville ou commune souhaitez-vous être livré(e) ?`,
    `C'est noté. Quelle est votre ville de livraison ?`,
    `Parfait. Dites-moi votre ville ou commune pour la livraison.`,
    `Très bien. Où souhaitez-vous être livré(e) ? (ville/commune)`,
  ]),

  askPhone: () => pick([
    `Merci. Quel est votre numéro de téléphone ?`,
    `C'est noté. Envoyez-moi votre numéro de téléphone s'il vous plaît.`,
    `Il me manque juste votre numéro de téléphone.`,
    `Parfait. Quel numéro pouvons-nous utiliser pour vous contacter ?`,
  ]),

  askName: () => pick([
    `Très bien ! Quel est votre nom complet pour la livraison ?`,
    `Merci. Dites-moi votre nom complet s'il vous plaît.`,
    `C'est noté. Il me faut votre nom complet pour finaliser.`,
    `Parfait. Quel nom mettons-nous sur la commande ?`,
  ]),

  askAddress: (city) => pick([
    `Parfait, *${city}* ! Pouvez-vous préciser votre commune ou un point de repère pour faciliter la livraison ?`,
    `Très bien, *${city}*. Donnez-moi un repère ou une adresse précise pour le livreur.`,
    `*${city}*, c'est noté. Un point de repère ou une adresse pour la livraison ?`,
  ]),

  confirmOrder: ({ product, qty, name, phone, city, address, total }) => pick([
    `Parfait 👌 Voici le récapitulatif de votre commande :\n\n🛍 Produit : ${product}\n📦 Quantité : ${qty}\n💰 Montant : ${formatPrice(total)}\n📍 Ville : ${city}\n${address ? '🏠 Adresse : ' + address + '\n' : ''}📱 Téléphone : ${phone}\n👤 Nom : ${name}\n\nPaiement à la livraison.\n\nTout est correct ? Répondez *OUI* pour confirmer ou *NON* pour modifier.`,
    `Merci 😊 Votre commande :\n\n• Produit : *${product}*\n• Quantité : ${qty}\n• Total : *${formatPrice(total)}*\n• Livraison : ${city}${address ? ' - ' + address : ''}\n• Téléphone : ${phone}\n• Nom : ${name}\n\nVous payez à la livraison.\n\nC'est bon pour vous ? *OUI* pour valider, *NON* pour corriger.`,
  ]),

  orderCreated: (reference) => pick([
    `✅ Votre commande est validée et transmise à notre équipe !\n\n📋 Référence : *${reference}*\nNous vous contacterons très bientôt pour confirmation.\n\nMerci pour votre confiance 🙏`,
    `Parfait, votre commande est bien enregistrée 👌\n\nRéférence : *${reference}*\nNotre équipe vous contactera rapidement pour la confirmation.\n\nMerci et à bientôt 😊`,
    `✅ C'est fait ! Votre commande *${reference}* est maintenant envoyée à notre équipe.\n\nVous serez contacté(e) sous peu. Merci pour votre confiance 🙏`,
  ]),

  deliveryInfo: () => pick([
    `📦 Pour la livraison :\n\n🏙 Abidjan : livraison rapide sous 24h\n💰 Paiement à la livraison\n\nVous payez quand vous recevez le produit, en toute tranquillité.`,
    `Nous livrons rapidement à Abidjan, avec paiement à la livraison. Vous ne payez qu'à la réception du produit, c'est plus rassurant.`,
    `La livraison se fait sous 24h à Abidjan. Vous payez à la réception, aucun paiement à l'avance.`,
  ]),

  paymentInfo: () => pick([
    `💰 Le paiement se fait à la livraison en cash. Vous payez uniquement quand vous recevez le produit.`,
    `C'est simple : vous payez à la réception du produit. Pas besoin de payer à l'avance.`,
  ]),

  handoff: () => pick([
    `D'accord, je transmets votre demande à un agent de notre équipe. Il prendra la suite rapidement 🙏`,
    `Très bien, un agent humain va reprendre la conversation. Merci de patienter un instant.`,
    `Compris. Je vous mets en relation avec un conseiller de notre équipe.`,
  ]),

  handoffAutomatic: (reason) => pick([
    `Je vais vous mettre en relation avec un de nos conseillers pour mieux vous assister. Merci de patienter 🙏`,
    `Un conseiller va prendre la suite pour vous aider au mieux. Merci de patienter un instant.`,
  ]),

  thanks: () => pick([
    `Merci à vous 😊 N'hésitez pas si vous avez d'autres questions. Bonne journée !`,
    `Avec plaisir ! Notre équipe reste disponible si vous avez besoin. Bonne journée 🙏`,
    `Merci pour votre confiance. À bientôt 😊`,
  ]),

  catalogList: (products) => {
    if (!products || products.length === 0) return 'Aucun produit disponible pour le moment.';
    const lines = products.slice(0, 15).map((p, i) =>
      `${i + 1}. *${p.nom}* — ${formatPrice(p.prixUnitaire)}`
    );
    return `📦 *Nos produits disponibles :*\n\n${lines.join('\n')}\n\nQuel produit vous intéresse ?`;
  },

  clarify: () => pick([
    `Je n'ai pas bien compris. Pouvez-vous reformuler ? Vous pouvez aussi taper :\n\n1️⃣ *Produits* pour voir notre catalogue\n2️⃣ *Commander* pour passer commande\n3️⃣ *Aide* pour parler à un conseiller`,
    `Pardon, je n'ai pas compris. Dites-moi ce qui vous intéresse et je vous réponds.`,
    `Excusez-moi, pouvez-vous reformuler ? Je suis là pour vous aider.`,
  ]),

  orderCancelled: () => pick([
    `D'accord, la commande est annulée. N'hésitez pas si vous changez d'avis 😊`,
    `C'est noté, pas de souci. Revenez quand vous voulez, on sera là pour vous aider.`,
  ]),

  alreadyHandoff: () =>
    `Votre conversation est en cours de traitement par un conseiller. Il vous répondra très rapidement 🙏`,

  statusCheck: () => pick([
    `Pour vérifier votre commande, pouvez-vous me donner votre nom ou votre numéro de téléphone ?`,
    `Donnez-moi votre nom ou numéro de téléphone et je vérifie le statut de votre commande.`,
  ]),

  productFaqEffect: (productKey) => {
    const pk = PRODUCT_KNOWLEDGE[productKey];
    if (!pk?.faq?.effect) return null;
    return pick(pk.faq.effect);
  },

  productFaqHowto: (productKey) => {
    const pk = PRODUCT_KNOWLEDGE[productKey];
    if (!pk?.faq?.howto) return null;
    return pick(pk.faq.howto);
  },

  productFaqWorks: (productKey) => {
    const pk = PRODUCT_KNOWLEDGE[productKey];
    if (!pk?.faq?.works) return null;
    return pick(pk.faq.works);
  },

  productHesitation: (productKey) => {
    const pk = PRODUCT_KNOWLEDGE[productKey];
    if (!pk?.faq?.hesitation) return null;
    return pick(pk.faq.hesitation);
  },

  pricingForProduct: (productKey) => {
    const pk = PRODUCT_KNOWLEDGE[productKey];
    if (!pk?.pricing) return null;
    const p = pk.pricing;
    return pick([
      `Pour la *${pk.displayName}* :\n• 1 paquet : ${formatPrice(p[1])}\n• 2 paquets : ${formatPrice(p[2])}\n• 3 paquets : ${formatPrice(p[3])}\n\nQuelle offre vous intéresse ?`,
      `La *${pk.displayName}* est à ${formatPrice(p[1])} le paquet, ${formatPrice(p[2])} les 2 paquets et ${formatPrice(p[3])} les 3 paquets.\n\nCombien en souhaitez-vous ?`,
    ]);
  },
};

function findProductKnowledge(productName) {
  if (!productName) return null;
  const norm = productName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, pk] of Object.entries(PRODUCT_KNOWLEDGE)) {
    const pkNorm = pk.displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes(pkNorm) || pkNorm.includes(norm)) return pk;
    if (norm.includes(key.replace(/_/g, ' '))) return pk;
  }
  return null;
}
