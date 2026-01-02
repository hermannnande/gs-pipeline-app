/**
 * Règles de tarification par quantité.
 *
 * Objectif: appliquer automatiquement les prix "pack" (ex: 9900 x2 = 16.900).
 *
 * IMPORTANT:
 * - Par défaut, on applique les packs uniquement pour les produits dont le prix unitaire
 *   correspond exactement à la clé (ex: 9900).
 * - Si une quantité n'est pas définie dans les packs, on retombe sur prixUnitaire * quantite.
 *
 * TODO (si vous confirmez la grille complète):
 * - Ajouter q=4,5,... ou permettre une configuration par produit/code.
 */

const PACK_PRICING_BY_UNIT_PRICE = {
  // Produits à 9.900 FCFA
  9900: {
    2: 16900,
    3: 24900,
  },
};

export function computeTotalAmount(prixUnitaire, quantite) {
  const unit = Number(prixUnitaire) || 0;
  const qty = Math.max(1, Number(quantite) || 1);

  const pack = PACK_PRICING_BY_UNIT_PRICE?.[unit]?.[qty];
  if (typeof pack === 'number') return pack;

  return unit * qty;
}

export function getPackPricingByUnitPrice() {
  return PACK_PRICING_BY_UNIT_PRICE;
}


