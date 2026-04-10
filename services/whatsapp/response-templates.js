import { WA_CONFIG } from './config.js';

const BIZ = WA_CONFIG.bot.businessName;

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Fr';
}

export const TEMPLATES = {
  welcome: () =>
    `Bonjour et bienvenue chez ${BIZ} ! 😊\n\nComment puis-je vous aider ?\n\n1️⃣ Voir nos produits\n2️⃣ Passer une commande\n3️⃣ Suivi de commande\n4️⃣ Parler à un conseiller`,

  welcomeBack: (name) =>
    `Rebonjour${name ? ' ' + name : ''} ! 😊\nComment puis-je vous aider aujourd'hui ?`,

  askProduct: () =>
    `Quel produit vous intéresse ? Vous pouvez me donner le nom ou me décrire ce que vous recherchez.`,

  productInfo: (product) =>
    `*${product.nom}*\n💰 Prix : ${formatPrice(product.prixUnitaire)}${product.prix2Unites ? '\n📦 2 unités : ' + formatPrice(product.prix2Unites) : ''}${product.prix3Unites ? '\n📦 3 unités : ' + formatPrice(product.prix3Unites) : ''}\n\nSouhaitez-vous commander ce produit ?`,

  productNotFound: () =>
    `Je n'ai pas trouvé ce produit dans notre catalogue. Pouvez-vous reformuler ou choisir parmi nos produits disponibles ?`,

  askQuantity: (productName) =>
    `Combien de *${productName}* souhaitez-vous commander ?`,

  askName: () =>
    `Très bien ! Quel est votre nom complet pour la livraison ?`,

  askPhone: () =>
    `Merci ! Quel est votre numéro de téléphone ?`,

  askCity: () =>
    `Dans quelle ville souhaitez-vous être livré(e) ?`,

  askAddress: (city) =>
    `Parfait, *${city}* ! Pouvez-vous préciser votre commune ou un point de repère pour faciliter la livraison ?`,

  confirmOrder: ({ product, qty, name, phone, city, address, total }) =>
    `📋 *Récapitulatif de votre commande :*\n\n` +
    `🛍 Produit : ${product}\n` +
    `📦 Quantité : ${qty}\n` +
    `👤 Nom : ${name}\n` +
    `📱 Téléphone : ${phone}\n` +
    `📍 Ville : ${city}\n` +
    (address ? `🏠 Adresse : ${address}\n` : '') +
    `💰 Total : ${formatPrice(total)}\n\n` +
    `Paiement à la livraison.\n\n` +
    `Tout est correct ? Répondez *OUI* pour confirmer ou *NON* pour modifier.`,

  orderCreated: (reference) =>
    `✅ Votre commande a été enregistrée avec succès !\n\n` +
    `📋 Référence : *${reference}*\n` +
    `Vous serez contacté(e) très bientôt pour la confirmation.\n\n` +
    `Merci pour votre confiance ! 🙏`,

  deliveryInfo: () =>
    `📦 *Informations livraison :*\n\n` +
    `🏙 Abidjan : Livraison sous 24-48h\n` +
    `🌍 Autres villes : Expédition sous 48-72h\n` +
    `💰 Paiement à la livraison (cash)\n\n` +
    `Pour les villes éloignées, des frais d'expédition peuvent s'appliquer.`,

  paymentInfo: () =>
    `💳 *Modes de paiement :*\n\n` +
    `💵 Cash à la livraison (Abidjan)\n` +
    `📱 Mobile Money (Wave, Orange Money, MTN)\n` +
    `Pour les expéditions : paiement 100% avant envoi\n` +
    `Pour les express : 10% d'avance, 90% au retrait`,

  handoff: () =>
    `Un conseiller va prendre la suite de cette conversation. Merci de patienter un instant ! 🙏`,

  handoffAutomatic: (reason) =>
    `Je vais vous mettre en relation avec un de nos conseillers pour mieux vous assister. Merci de patienter ! 🙏`,

  thanks: () =>
    `Merci à vous ! N'hésitez pas si vous avez d'autres questions. 😊\nBonne journée ! 🙏`,

  catalogList: (products) => {
    if (!products || products.length === 0) return 'Aucun produit disponible pour le moment.';
    const lines = products.slice(0, 15).map((p, i) =>
      `${i + 1}. *${p.nom}* — ${formatPrice(p.prixUnitaire)}`
    );
    return `📦 *Nos produits disponibles :*\n\n${lines.join('\n')}\n\nQuel produit vous intéresse ?`;
  },

  clarify: () =>
    `Je n'ai pas bien compris. Pouvez-vous reformuler votre demande ? Vous pouvez aussi taper :\n\n1️⃣ *Produits* pour voir notre catalogue\n2️⃣ *Commander* pour passer commande\n3️⃣ *Aide* pour parler à un conseiller`,

  orderCancelled: () =>
    `D'accord, la commande a été annulée. N'hésitez pas si vous changez d'avis ! 😊`,

  alreadyHandoff: () =>
    `Votre conversation est en cours de traitement par un conseiller. Il vous répondra très rapidement ! 🙏`,

  statusCheck: () =>
    `Pour vérifier votre commande, pouvez-vous me donner votre nom ou votre numéro de téléphone ?`,
};
