/**
 * Télécharge les images WordPress de creme-anti-verrue-bleu,
 * les convertit en WebP compressés (< ~120 KB sauf hero ~150 KB).
 *
 * Usage : node scripts/compress-creme-anti-verrue-bleu.mjs
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE = 'https://obrille.com/wp-content/uploads/2026/06/';
const OUT = resolve('frontend/public/creme-anti-verrue-bleu');
mkdirSync(OUT, { recursive: true });

const FILES = [
  { remote: 'Collage_photo_women_men_black_202606282128-5.jpeg', local: 'hero.webp', maxW: 900, q: 68 },
  { remote: 'ChatGPT-Image-28-juin-2026-21_37_26.png', local: 'gallery-1.webp', maxW: 880, q: 62 },
  { remote: 'Collage_photo_women_men_black_202606282128-4.jpeg', local: 'gallery-2.webp', maxW: 880, q: 65 },
  { remote: 'ChatGPT-Image-28-juin-2026-21_39_25.png', local: 'gallery-3.webp', maxW: 880, q: 62 },
  { remote: 'Collage_photo_women_men_black_202606282128-3.jpeg', local: 'gallery-4.webp', maxW: 880, q: 65 },
  { remote: 'Collage_photo_women_men_black_202606282128-2.jpeg', local: 'gallery-5.webp', maxW: 880, q: 65 },
  { remote: 'Collage_photo_women_men_black_202606282128-1.jpeg', local: 'gallery-6.webp', maxW: 880, q: 65 },
];

let totalBefore = 0;
let totalAfter = 0;

for (const f of FILES) {
  const url = BASE + f.remote;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  totalBefore += buf.length;

  const out = await sharp(buf)
    .resize({ width: f.maxW, withoutEnlargement: true })
    .webp({ quality: f.q, effort: 6 })
    .toBuffer();

  const outPath = join(OUT, f.local);
  writeFileSync(outPath, out);
  totalAfter += out.length;
  console.log(`${f.local.padEnd(16)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB -> ${(out.length / 1024).toFixed(0).padStart(4)} KB`);
}

console.log('---');
console.log(`Total : ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB (gain ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
console.log(`Dossier : ${OUT}`);
