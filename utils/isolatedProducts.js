/**
 * Produits isolés : leurs commandes sont gérées sur une page dédiée
 * (ex. https://obrille.com/bouilloire-commandes), pas dans le pipeline
 * standard (À appeler, Commandes validées, assignation livreurs).
 */
export const ISOLATED_PRODUCT_CODES = ['BOUILLOIRE_INTELLIGENTE'];

/** Filtre Prisma : exclut les commandes des produits isolés (garde productId null). */
export const excludeIsolatedProductsFilter = {
  OR: [
    { productId: null },
    { product: { code: { notIn: ISOLATED_PRODUCT_CODES } } },
  ],
};
