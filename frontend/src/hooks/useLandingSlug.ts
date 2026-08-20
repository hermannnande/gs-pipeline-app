import { useParams, useLocation } from 'react-router-dom';

// Single source of truth pour TOUS les slugs de landing pages.
// Importe par App.tsx (genere les <Route />) ET par useLandingSlug (parsing URL).
// Ajouter ici fait apparaitre le slug partout automatiquement.
export const LANDING_SLUGS = [
  'creme-anti-verrue',
  'creme-anti-verrue-bleu',
  'creme-anti-verrue-bleu-tk',
  'promo-verrue',
  'creme-verrue-tk',
  'creme-verrue-tk2',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'creme-ongle-incarne-v2',
  'bande-sport-minceur',
  'bande-sport-tk',
  'detoxminceur',
  'patch-minceur-glp',
  'patch-minceur-promo',
  'chaussette',
  'chaussette-compression',
  'chaussette-compression-v2',
  'patchdouleurtk',
  'patchdouleurfb',
  'patchdouleurtiktok',
  'crememinceurfb',
  'spraylipome',
  'spraylipometk',
  'spraylipome-promo',
  'creme-anti-lipome',
  'creme-anti-lipome-tk',
  'creme-lipome-tk3',
  'creme-lipome-offre',
  'creme-eczema',
  'chaussette-homme',
  'chaussette-premium-homme',
  'creme-anti-cerne',
  'serum-cerne',
  'serum-cerne-tiktok',
  'serum-cerne-tk',
  'serum-cerne-paye',
  'anti-age',
  'coffret-boxer-homme',
  'coffret-boxer-luxe-v3',
  'poudre-pousse-cheveux',
  'spray-vitiligo',
  'chapeau-gavroche',
  'chapeau-dame',
  'lunette-de-nuit',
  'bouilloire-intelligente',
  'guide-pousse-naturelle',
  'mini-sac-bandouliere',
  'mini-sac-bandouliere-tk',
  'serum-rajeunissant',
  'serum-rajeunissant-tk',
  'support-telephone-flexible',
  'repulsif-ultrasons',
  'sac-louis-vuitton',
  'sangles-rotuliennes',
  'sangles-rotuliennes-tk',
  'bandes-buccales-sommeil',
  'support-telephone-flexible-tk',
  'bandes-buccales-sommeil-tk',
  'ajusteur-ceinture',
  'ajusteur-ceinture-tk',
  'oxymetre-pouls',
  'oxymetre-pouls-tk',
  'serum-cerne-offre',
  'boutique',
] as const;

const VALID_LANDING_SLUGS: readonly string[] = LANDING_SLUGS;

export function useLandingSlug(): string | undefined {
  const params = useParams<{ slug?: string }>();
  const location = useLocation();

  if (params.slug) return params.slug;

  const cleaned = location.pathname
    .replace(/^\//, '')
    .replace(/\/merci\/?$/, '')
    .replace(/\/$/, '');

  if (!cleaned || cleaned.includes('/')) return undefined;

  return VALID_LANDING_SLUGS.includes(cleaned) ? cleaned : undefined;
}
