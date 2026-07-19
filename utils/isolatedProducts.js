/**
 * Produits isolés : leurs commandes sont gérées hors pipeline obgestion
 * (page dédiée ou autre flux). La bouilloire est désormais dans le pipeline
 * standard (À appeler, validées, livraison) tout en gardant bouilloire-commandes.
 */
export const ISOLATED_PRODUCT_CODES = ['GUIDE_POUSSE_NATURELLE'];

/** Filtre Prisma : exclut les commandes des produits isolés (garde productId null). */
export const excludeIsolatedProductsFilter = {
  OR: [
    { productId: null },
    { product: { code: { notIn: ISOLATED_PRODUCT_CODES } } },
  ],
};
