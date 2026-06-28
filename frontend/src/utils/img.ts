/**
 * Optimisation d'images via le proxy wsrv.nl (images.weserv.nl).
 * Convertit à la volée en WebP + redimensionne + qualité + CDN cache.
 * - Les chemins locaux (`/...`) et data: sont laissés tels quels (déjà optimisés).
 * - Les vidéos/gif passent sans transformation.
 *
 * Pour optimiser un fichier LOCAL non-webp servi par le VPS, passer son URL
 * ABSOLUE (ex. optimImg('https://obrille.com/x/hero.jpg', 800)).
 */
const IMG_PROXY = 'https://wsrv.nl/?';

export function optimImg(src: string, w = 900, q = 75): string {
  if (!src || src.startsWith('data:') || src.startsWith('/')) return src;
  if (/\.(gif|mp4|webm)$/i.test(src)) return src;
  return `${IMG_PROXY}url=${encodeURIComponent(src)}&w=${w}&q=${q}&output=webp&il`;
}

export function optimImgSrcSet(src: string, sizes: number[] = [400, 800, 1200], q = 75): string {
  if (!src || src.startsWith('data:') || src.startsWith('/')) return '';
  if (/\.(gif|mp4|webm)$/i.test(src)) return '';
  return sizes.map((w) => `${optimImg(src, w, q)} ${w}w`).join(', ');
}
