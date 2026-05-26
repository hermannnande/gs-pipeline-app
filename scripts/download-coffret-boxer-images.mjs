/**
 * Telecharge les 14 images coffret-boxer (9 Tommy Hilfiger + 5 Luxe) depuis
 * obrille.com, puis les compresse en WebP <= 200 KB (hero un peu plus grand).
 *
 * Sortie : frontend/public/coffret-boxer-homme/
 *   tommy-1.webp ... tommy-9.webp
 *   luxe-1.webp  ... luxe-5.webp
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../frontend/public/coffret-boxer-homme');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const TOMMY = [
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_28.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_59-1.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_34.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_15.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_22.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_43_09.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_42_58.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_42_50.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_42_45.png',
];

const LUXE = [
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_54_20.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_54_14.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_54_58.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_55_23.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-15-mai-2026-02_55_05.png',
];

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function processOne(url, outName, isHero) {
  console.log(`-> ${outName}  fetching...`);
  const srcBuf = await download(url);
  const before = srcBuf.length;
  const out = await sharp(srcBuf)
    .rotate()
    .resize({ width: isHero ? 880 : 760, withoutEnlargement: true })
    .webp({ quality: isHero ? 72 : 65, effort: 6 })
    .toBuffer();
  const outPath = path.join(OUT_DIR, outName);
  fs.writeFileSync(outPath, out);
  console.log(`   ${(before / 1024).toFixed(0)}KB src -> ${(out.length / 1024).toFixed(0)}KB ${outName}`);
  return { before, after: out.length };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  let i = 1;
  for (const url of TOMMY) {
    const r = await processOne(url, `tommy-${i}.webp`, i === 1);
    totalBefore += r.before;
    totalAfter += r.after;
    i++;
  }
  i = 1;
  for (const url of LUXE) {
    const r = await processOne(url, `luxe-${i}.webp`, i === 1);
    totalBefore += r.before;
    totalAfter += r.after;
    i++;
  }
  console.log('---');
  console.log(
    `Total : ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB ` +
      `(gain ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`,
  );
}

main().catch((err) => {
  console.error('ERREUR :', err.message);
  process.exit(1);
});
