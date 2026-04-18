import { useParams, useLocation } from 'react-router-dom';

const VALID_LANDING_SLUGS = [
  'creme-anti-verrue',
  'creme-verrue-tk',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'chaussette-compression',
];

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
