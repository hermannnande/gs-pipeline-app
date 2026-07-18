/**
 * Telecharge les 7 visuels complementaires de la landing creme-anti-lipome
 * depuis obrille.com, puis les compresse en WebP same-origin.
 *
 * Les PNG sources font 2 a 2,7 Mo piece (15,6 Mo au total) : inservables tels
 * quels sur mobile. On les sert en WebP local, comme n1..n9 deja en place.
 *
 * Sortie : frontend/public/lipome/n10.webp ... n16.webp
 *          (suite de la serie n1..n9, reprise telle quelle par IMG() dans la page)
 *
 * Un apercu JPEG basse def est ecrit dans PREVIEW_DIR pour relecture visuelle.
 *
 * Deploiement : necessite `node scripts/deploy-vps.mjs --with-images`
 * (le dossier lipome/ n'est pas dans le package rapide par defaut).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../frontend/public/lipome');
const PREVIEW_DIR = process.env.PREVIEW_DIR || '';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (PREVIEW_DIR && !fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const BASE = 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-17-juil.-2026-';

/** Ordre voulu sur la page = ordre fourni par le client. */
const SOURCES = [
  '19_33_16',
  '19_32_59',
  '19_32_41',
  '19_32_36',
  '19_32_32',
  '19_32_27',
  '19_32_20-3',
];

const FIRST_INDEX = 10; // n10..n16, a la suite de n1..n9

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

async function processOne(slug, outName) {
  const url = `${BASE}${slug}.png`;
  console.log(`-> ${outName}  telechargement...`);
  const srcBuf = await download(url);
  const before = srcBuf.length;
  const meta = await sharp(srcBuf).metadata();

  const out = await sharp(srcBuf)
    .rotate()
    .resize({ width: 860, withoutEnlargement: true })
    .webp({ quality: 70, effort: 6 })
    .toBuffer();

  fs.writeFileSync(path.join(OUT_DIR, outName), out);

  if (PREVIEW_DIR) {
    const preview = await sharp(srcBuf)
      .rotate()
      .resize({ width: 420, withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();
    fs.writeFileSync(path.join(PREVIEW_DIR, outName.replace('.webp', '.jpg')), preview);
  }

  console.log(
    `   ${meta.width}x${meta.height}  ${(before / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`,
  );
  return { before, after: out.length };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;

  for (let i = 0; i < SOURCES.length; i++) {
    const r = await processOne(SOURCES[i], `n${FIRST_INDEX + i}.webp`);
    totalBefore += r.before;
    totalAfter += r.after;
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
