/**
 * Convertit les sources m1..m17 en WebP < 200 KB (max 880 px), supprime les .src.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, '../frontend/public/chaussettes-homme');

const sources = fs.readdirSync(DIR).filter((f) => f.endsWith('.src'));
for (const src of sources) {
  const base = src.replace(/\.src$/, '');
  const inPath = path.join(DIR, src);
  const outPath = path.join(DIR, `${base}.webp`);
  await sharp(inPath)
    .resize({ width: 880, withoutEnlargement: true })
    .webp({ quality: 72, effort: 5 })
    .toFile(outPath);
  const before = fs.statSync(inPath).size;
  const after = fs.statSync(outPath).size;
  console.log(`${base}.webp  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
  fs.unlinkSync(inPath);
}
