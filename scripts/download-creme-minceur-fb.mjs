/**
 * Télécharge les médias pour la landing crememinceurfb (nouveau tunnel).
 * Usage : node scripts/download-creme-minceur-fb.mjs
 */
import { mkdirSync, createWriteStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';

const RAW = 'frontend/public/creme-minceur-fb/_raw';
mkdirSync(RAW, { recursive: true });

const REMOTE = [
  ['https://obrille.com/wp-content/uploads/2026/06/r2.mp4', 'r2.mp4'],
  ['https://obrille.com/wp-content/uploads/2026/06/r1-3.mp4', 'r1-3.mp4'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-5-juin-2026-17_05_45.png', 'img-new-1.png'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-5-juin-2026-17_05_38.png', 'img-new-2.png'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-5-juin-2026-16_41_27.png', 'img-new-3.png'],
];

const LOCAL = [
  ['frontend/public/creme-minceur/video-1.mp4', 'video-1.mp4'],
  ['frontend/public/creme-minceur/video-2.mp4', 'video-2.mp4'],
  ['frontend/public/creme-minceur/video-3.mp4', 'video-3.mp4'],
  ['frontend/public/creme-minceur/gallery-1.webp', 'gallery-1.webp'],
  ['frontend/public/creme-minceur/gallery-2.webp', 'gallery-2.webp'],
  ['frontend/public/creme-minceur/gallery-3.webp', 'gallery-3.webp'],
  ['frontend/public/creme-minceur/avant.webp', 'avant.webp'],
  ['frontend/public/creme-minceur/apres.webp', 'apres.webp'],
];

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log(`  skip (exists): ${dest}`);
    return;
  }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(`  ok: ${dest}`);
}

console.log('=== Remote ===');
for (const [url, name] of REMOTE) {
  await download(url, join(RAW, name));
}

console.log('\n=== Local copy ===');
import { copyFileSync } from 'node:fs';
for (const [src, name] of LOCAL) {
  const dest = join(RAW, name);
  if (!existsSync(src)) {
    console.warn(`  missing: ${src}`);
    continue;
  }
  copyFileSync(src, dest);
  console.log(`  copied: ${name}`);
}

console.log('\nDone. Run: node scripts/optimize-creme-minceur-fb.mjs');
