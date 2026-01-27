/**
 * Calcule le prix total en fonction de la quantité et des paliers de prix du produit
 * @param product - Le produit avec ses différents prix
 * @param quantite - La quantité commandée
 * @returns Le prix total calculé
 */
export function calculatePriceByQuantity(product: any, quantite: number): number {
  if (!product) return 0;
  
  // Si quantité = 1, toujours le prix unitaire
  if (quantite === 1) {
    return product.prixUnitaire;
  }
  
  // Si quantité = 2 et prix2Unites existe, utiliser ce prix
  if (quantite === 2 && product.prix2Unites) {
    return product.prix2Unites;
  }
  
  // Si quantité >= 3 et prix3Unites existe, utiliser ce prix
  if (quantite >= 3 && product.prix3Unites) {
    return product.prix3Unites;
  }
  
  // Par défaut : prix unitaire * quantité
  return product.prixUnitaire * quantite;
}

/**
 * Obtient le libellé du prix selon la quantité
 * @param product - Le produit
 * @param quantite - La quantité
 * @returns Le libellé explicatif
 */
export function getPriceLabel(product: any, quantite: number): string {
  if (!product) return '';
  
  if (quantite === 1) {
    return 'Prix unitaire';
  }
  
  if (quantite === 2 && product.prix2Unites) {
    return `Prix pour 2 unités (tarif spécial)`;
  }
  
  if (quantite >= 3 && product.prix3Unites) {
    return `Prix pour ${quantite} unités (tarif spécial)`;
  }
  
  return `Prix unitaire × ${quantite}`;
}
