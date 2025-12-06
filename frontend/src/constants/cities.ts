/**
 * Liste officielle des villes et agences EXPRESS en Côte d'Ivoire
 * Utilisée pour :
 * - Sélection d'agence de retrait dans le modal EXPRESS
 * - Filtres par ville et agence dans la page Expéditions & EXPRESS
 */
export const VILLES_AGENCES_EXPRESS = [
  'Beoumi',
  'Bocanda',
  'Bonon',
  'Bouaflé',
  'Bouaké',
  'Daloa',
  'Dimbokro',
  'Divo',
  'Duékoué',
  'Gabiadji',
  'Gagnoa',
  'Gonaté',
  'Guibéroua',
  'Hiré',
  'Issia',
  'Man',
  'Méagui',
  'San Pedro',
  'Sinfra',
  'Soubré',
  'Tiébissou',
  'Toumodi',
  'Yabayo',
  'Yamoussoukro',
] as const;

export type VilleAgenceExpress = typeof VILLES_AGENCES_EXPRESS[number];

