/**
 * Telecharge la video hero pour la landing poudre-pousse-cheveux.
 *
 * Sortie : frontend/public/poudre-pousse-cheveux/hero.mp4
 * Usage  : node scripts/download-poudre-cheveux-hero-video.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'poudre-pousse-cheveux');
mkdirSync(DST, { recursive: true });

const URL = 'https://obrille.com/wp-content/uploads/2026/06/Ma-video-5.mp4';
const OUT = join(DST, 'hero.mp4');

if (existsSync(OUT) && statSync(OUT).size > 50000) {
  console.log(`Existe deja : ${OUT} (${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
  process.exit(0);
}

console.log(`Telechargement : ${URL}`);
const res = await fetch(URL, {
  headers: { 'User-Agent': 'Mozilla/5.0' },
  signal: AbortSignal.timeout(180000),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(OUT, buf);
console.log(`OK : ${OUT} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
