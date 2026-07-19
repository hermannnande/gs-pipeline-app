/**
 * Compresse les images du tunnel Creme Verrue TK (V2 marron/rose) en WebP.
 * Sortie : frontend/public/creme-verrue-tk-v2/*.webp
 *
 * Utilisation : node scripts/compress-creme-verrue-tk.mjs [nom...]
 *   sans argument : recompresse tout
 *   avec noms     : seulement ceux-ci (ex. `node scripts/compress-creme-verrue-tk.mjs hero`)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'frontend', 'public', 'creme-verrue-tk-v2');

const WP = (n) => `https://obrille.com/wp-content/uploads/2026/05/${n}`;
const WP7 = (n) => `https://obrille.com/wp-content/uploads/2026/07/${n}`;

const IMAGES = [
  // Hero remplace le 19/07/2026 (visuel juillet), d'ou l'URL 2026/07 hors helper WP.
  { name: 'hero', src: 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-19-juil.-2026-11_42_41.png', width: 1200, quality: 82 },
  // m01-m07 remplaces le 19/07/2026 (serie tube bleu, alignee sur le hero).
  { name: 'm01',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_32.png'), width: 1024, quality: 80 },
  { name: 'm02',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_24.png'), width: 1024, quality: 80 },
  { name: 'm03',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_20.png'), width: 1024, quality: 80 },
  { name: 'm04',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_14.png'), width: 1024, quality: 80 },
  { name: 'm05',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_10.png'), width: 1024, quality: 80 },
  { name: 'm06',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_06.png'), width: 1024, quality: 80 },
  { name: 'm07',  src: WP7('ChatGPT-Image-19-juil.-2026-12_14_01.png'), width: 1024, quality: 80 },
  { name: 'wa',   src: WP('4eea2c05e3480528db46e245828799b3.jpg'),    width: 800,  quality: 82 },
  { name: 'm08',  src: WP('ChatGPT-Image-24-mai-2026-20_07_29.png'), width: 1024, quality: 80 },
  { name: 'avant',src: WP('ChatGPT-Image-24-mai-2026-20_01_46.png'), width: 1024, quality: 80 },
  { name: 'apres',src: WP('ChatGPT-Image-24-mai-2026-20_01_40.png'), width: 1024, quality: 80 },
  { name: 'm09',  src: WP('ChatGPT-Image-24-mai-2026-20_01_35.png'), width: 1024, quality: 80 },
];

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`✓ Dossier créé : ${OUT_DIR}`);
  }
  const only = process.argv.slice(2);
  const targets = only.length ? IMAGES.filter(i => only.includes(i.name)) : IMAGES;
  if (!targets.length) throw new Error(`Aucune image nommee : ${only.join(', ')}`);
  let totalIn = 0, totalOut = 0;
  for (const img of targets) {
    const outPath = join(OUT_DIR, `${img.name}.webp`);
    process.stdout.write(`→ ${img.name.padEnd(8)} `);
    const buf = await fetchBuffer(img.src);
    totalIn += buf.length;
    const webp = await sharp(buf)
      .resize({ width: img.width, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: img.quality, effort: 6 })
      .toBuffer();
    await writeFile(outPath, webp);
    totalOut += webp.length;
    const inKB = (buf.length / 1024).toFixed(0);
    const outKB = (webp.length / 1024).toFixed(0);
    const ratio = ((1 - webp.length / buf.length) * 100).toFixed(0);
    console.log(`${inKB} KB → ${outKB} KB  (-${ratio}%)`);
  }
  console.log('');
  console.log(`Total : ${(totalIn/1024/1024).toFixed(2)} MB → ${(totalOut/1024/1024).toFixed(2)} MB`);
  console.log(`Gain  : -${((1 - totalOut/totalIn)*100).toFixed(0)}% (${((totalIn-totalOut)/1024/1024).toFixed(2)} MB économisés)`);
}
main().catch(e => { console.error('✗ Erreur :', e); process.exit(1); });
