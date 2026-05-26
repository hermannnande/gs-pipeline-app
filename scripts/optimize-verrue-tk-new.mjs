// Compression agressive des 9 nouvelles images creme-verrue-tk
// JPG -> WebP, maxW 1000px, quality 58 (meme profil que les autres landings)
import sharp from 'sharp';
import { readdirSync, statSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'frontend/public/verrue-tk';
const NEW = join(DIR, 'new');
const IMG_MAX_W = 1000;
const IMG_Q = 58;

const files = readdirSync(NEW).filter(f => /\.(jpe?g|png)$/i.test(f));
console.log(`Compression de ${files.length} images...`);

let totalIn = 0, totalOut = 0;

for (const f of files) {
  const src = join(NEW, f);
  const outName = f.replace(/\.(jpe?g|png)$/i, '.webp');
  const out = join(DIR, outName);
  const inBuf = readFileSync(src);
  const inSize = inBuf.length;
  totalIn += inSize;

  const img = sharp(inBuf).rotate();
  const meta = await img.metadata();
  const w = meta.width && meta.width > IMG_MAX_W ? IMG_MAX_W : meta.width;

  const outBuf = await img
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: IMG_Q, effort: 6, smartSubsample: true })
    .toBuffer();

  writeFileSync(out, outBuf);
  totalOut += outBuf.length;

  console.log(
    `  ${outName.padEnd(14)} ${String((inSize / 1024).toFixed(0)).padStart(4)}KB -> ${String(
      (outBuf.length / 1024).toFixed(0),
    ).padStart(4)}KB (-${((1 - outBuf.length / inSize) * 100).toFixed(0)}%)`,
  );

  // On supprime la source JPG
  try { unlinkSync(src); } catch {}
}

console.log(
  `\nTotal : ${(totalIn / 1024 / 1024).toFixed(2)} MB -> ${(totalOut / 1024 / 1024).toFixed(
    2,
  )} MB (-${((1 - totalOut / totalIn) * 100).toFixed(0)}%)`,
);

// Nettoyage dossier temporaire si vide
try {
  const remain = readdirSync(NEW);
  if (remain.length === 0) {
    const { rmdirSync } = await import('node:fs');
    rmdirSync(NEW);
    console.log('Dossier new/ nettoye');
  }
} catch {}
