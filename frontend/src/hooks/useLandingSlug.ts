import { useParams, useLocation } from 'react-router-dom';

// Single source of truth pour TOUS les slugs de landing pages.
// Importe par App.tsx (genere les <Route />) ET par useLandingSlug (parsing URL).
// Ajouter ici fait apparaitre le slug partout automatiquement.
export const LANDING_SLUGS = [
  'creme-anti-verrue',
  'creme-verrue-tk',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'chaussette-compression',
  'patchdouleurtk',
  'patchdouleurfb',
  'crememinceurfb',
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
