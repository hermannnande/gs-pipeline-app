/**
 * Convertit m1..m14 en WebP < 200 KB. Hero (m1) plus grand/qualite, autres compresses.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, '../frontend/public/creme-anti-cerne');

const sources = fs.readdirSync(DIR).filter((f) => f.endsWith('.src'));
let totalBefore = 0, totalAfter = 0;
for (const src of sources) {
  const base = src.replace(/\.src$/, '');
  const inPath = path.join(DIR, src);
  const outPath = path.join(DIR, `${base}.webp`);
  const isHero = base === 'm1';
  const srcBuf = fs.readFileSync(inPath);
  const before = srcBuf.length;
  totalBefore += before;
  const out = await sharp(srcBuf)
    .resize({ width: isHero ? 760 : 700, withoutEnlargement: true })
    .webp({ quality: isHero ? 70 : 65, effort: 6 })
    .toBuffer();
  fs.writeFileSync(outPath, out);
  totalAfter += out.length;
  console.log(`${base}.webp  ${(before / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`);
  fs.unlinkSync(inPath);
}
console.log('---');
console.log(`Total : ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB  (gain ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
