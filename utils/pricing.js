/**
 * Règles de tarification par quantité.
 *
 * Système de tarification à 3 niveaux :
 * 1. Si le produit a des prix personnalisés (prix2Unites, prix3Unites), les utiliser
 * 2. Sinon, utiliser les packs par défaut (PACK_PRICING_BY_UNIT_PRICE)
 * 3. Sinon, utiliser prixUnitaire * quantite
 */

const PACK_PRICING_BY_UNIT_PRICE = {
  // Produits à 9.900 FCFA (pour rétrocompatibilité)
  9900: {
    2: 16900,
    3: 24900,
  },
};

/**
 * Calcule le montant total selon la quantité et les paliers de prix du produit
 * @param {number|object} prixUnitaireOrProduct - Prix unitaire OU objet produit complet
 * @param {number} quantite - Quantité commandée
 * @returns {number} Montant total
 */
export function computeTotalAmount(prixUnitaireOrProduct, quantite) {
  const qty = Math.max(1, Number(quantite) || 1);
  
  // Si c'est un objet produit avec des prix personnalisés
  if (typeof prixUnitaireOrProduct === 'object' && prixUnitaireOrProduct !== null) {
    const product = prixUnitaireOrProduct;
    const unit = Number(product.prixUnitaire) || 0;
    
    // Quantité = 1 : toujours le prix unitaire
    if (qty === 1) {
      return unit;
    }
    
    // Quantité = 2 : utiliser prix2Unites si défini
    if (qty === 2 && product.prix2Unites != null) {
      return Number(product.prix2Unites);
    }
    
    // Quantité >= 3 : utiliser prix3Unites si défini
    if (qty >= 3 && product.prix3Unites != null) {
      return Number(product.prix3Unites);
    }
    
    // Fallback sur les packs par défaut
    const pack = PACK_PRICING_BY_UNIT_PRICE?.[unit]?.[qty];
    if (typeof pack === 'number') return pack;
    
    // Fallback final : prix unitaire * quantité
    return unit * qty;
  }
  
  // Si c'est juste un prix unitaire (mode ancien)
  const unit = Number(prixUnitaireOrProduct) || 0;
  
  // Vérifier les packs par défaut
  const pack = PACK_PRICING_BY_UNIT_PRICE?.[unit]?.[qty];
  if (typeof pack === 'number') return pack;

  return unit * qty;
}

export function getPackPricingByUnitPrice() {
  return PACK_PRICING_BY_UNIT_PRICE;
}


