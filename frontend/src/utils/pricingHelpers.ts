/**
 * Frais de livraison web (CI). 0 = prix affiché = prix facturé (livraison incluse / gratuite).
 */
export const DELIVERY_FEE_CI = 0;

/** Packs standard — 1×9 900 · 2×16 900 · 3×24 900 F (total client). */
export const STANDARD_PACK_PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };

/**
 * Prix pack produit seul (sans frais additionnels).
 */
export function packAmount(prices: Record<number, number>, qty: number): number {
  const q = Math.max(1, Math.min(3, Number(qty) || 1));
  return prices[q] ?? prices[1] ?? 0;
}

/** Total commande affiché et facturé (= prix du pack). */
export function orderTotal(prices: Record<number, number>, qty: number): number {
  return packAmount(prices, qty) + DELIVERY_FEE_CI;
}

/** Libellé prix commande affiché sur landings / formulaires (ex. "7 500 F"). */
export function packLabel(
  prices: Record<number, number>,
  qty: number,
  suffix: 'F' | 'FCFA' = 'F',
): string {
  const n = orderTotal(prices, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
  return suffix === 'FCFA' ? `${n} FCFA` : `${n} F`;
}

/** Enregistrement des totaux commande pour qty 1/2/3 (passe aux modals / tracking). */
export function pricesWithDelivery(prices: Record<number, number>): Record<number, number> {
  return { 1: orderTotal(prices, 1), 2: orderTotal(prices, 2), 3: orderTotal(prices, 3) };
}

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
 * Total commande depuis un produit API (= prix palier, sans supplément livraison).
 */
export function orderTotalFromProduct(product: any, quantite: number): number {
  return calculatePriceByQuantity(product, quantite) + DELIVERY_FEE_CI;
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
