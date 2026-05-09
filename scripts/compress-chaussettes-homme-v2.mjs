/**
 * Recompresse plus agressivement les images chaussettes-homme :
 * max 720px (au lieu de 880), qualite 66 (au lieu de 72), effort 6.
 * Reecrit en place, ne touche pas le hero qui sera traite a part.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, '../frontend/public/chaussettes-homme');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.webp'));
let totalBefore = 0;
let totalAfter = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  const before = fs.statSync(p).size;
  totalBefore += before;
  // Le hero (m1) merite plus de qualite, plus de pixels
  const isHero = f === 'm1.webp';
  // Lire d'abord, fermer le handle, puis encoder
  const srcBuf = fs.readFileSync(p);
  const outBuf = await sharp(srcBuf)
    .resize({ width: isHero ? 760 : 700, withoutEnlargement: true })
    .webp({ quality: isHero ? 70 : 64, effort: 6 })
    .toBuffer();
  fs.writeFileSync(p, outBuf);
  const after = fs.statSync(p).size;
  totalAfter += after;
  console.log(`${f}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB  (${isHero ? 'hero' : 'std'})`);
}
console.log('---');
console.log(`Total : ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB  (gain ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
