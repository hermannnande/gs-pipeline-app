/**
 * Compression poudre-pousse-cheveux :
 *   - Renomme + compresse les sources de `src/` vers le dossier parent
 *   - PNG/JPG -> WebP Q=70, max 1100px (visuels ChatGPT nets, plus large que spray-lipome)
 *   - MP4 -> H264 CRF 30, 540p, audio retire (boucles muettes)
 *   - Source `src/` supprime apres compression
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { readFileSync, writeFileSync, statSync, existsSync, unlinkSync, readdirSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC_DIR = 'frontend/public/poudre-pousse-cheveux/src';
const DST_DIR = 'frontend/public/poudre-pousse-cheveux';
const ffmpegPath = ffmpegInstaller.path;

const IMG_Q = 70;
const IMG_MAX_W = 1100;
const VID_CRF = 30;
const VID_HEIGHT = 540;

// Plan de renommage (13 medias UNIQUES = 13 blocs)
const IMAGES = [
  ['new-2.png',     'hero.webp'],
  ['old-img-1.png', 'block-1.webp'],
  ['old-img-2.png', 'block-2.webp'],
  ['new-1.png',     'block-3.webp'],
  ['old-img-3.png', 'block-4.webp'],
  ['old-img-4.png', 'block-5.webp'],
  ['old-img-5.png', 'block-6.webp'],
  ['old-img-6.png', 'block-7.webp'],
  ['new-3.jpg',     'block-8.webp'],
  ['new-4.jpg',     'avatar.webp'],
];
const VIDEOS = [
  ['old-video-1.mp4', 'video-1.mp4'],
  ['old-video-2.mp4', 'video-2.mp4'],
  ['old-video-3.mp4', 'video-3.mp4'],
];

console.log(`\n=== IMAGES (Q=${IMG_Q}, maxW=${IMG_MAX_W}) ===`);
let iIn = 0, iOut = 0;
for (const [srcName, dstName] of IMAGES) {
  const src = join(SRC_DIR, srcName);
  const dst = join(DST_DIR, dstName);
  if (!existsSync(src)) { console.log(`  SKIP ${srcName} (absent)`); continue; }
  const inBuf = readFileSync(src);
  iIn += inBuf.length;
  try {
    const s = sharp(inBuf).rotate();
    const meta = await s.metadata();
    const w = meta.width && meta.width > IMG_MAX_W ? IMG_MAX_W : meta.width;
    const outBuf = await s.resize({ width: w, withoutEnlargement: true })
      .webp({ quality: IMG_Q, effort: 6, smartSubsample: true })
      .toBuffer();
    writeFileSync(dst, outBuf);
    iOut += outBuf.length;
    console.log(`  OK   ${dstName.padEnd(14)} ${String((inBuf.length / 1024).toFixed(0)).padStart(5)}KB -> ${String((outBuf.length / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outBuf.length / inBuf.length) * 100).toFixed(0)}%)`);
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log(`  ERR ${srcName}: ${e.message}`); }
}
console.log(`Total images : ${(iIn / 1024).toFixed(0)}KB -> ${(iOut / 1024).toFixed(0)}KB (-${((1 - iOut / iIn) * 100).toFixed(0)}%)`);

console.log(`\n=== VIDEOS (CRF=${VID_CRF}, ${VID_HEIGHT}p, no audio) ===`);
let vIn = 0, vOut = 0;
for (const [srcName, dstName] of VIDEOS) {
  const src = join(SRC_DIR, srcName);
  const dst = join(DST_DIR, dstName);
  if (!existsSync(src)) { console.log(`  SKIP ${srcName} (absent)`); continue; }
  const inSz = statSync(src).size;
  vIn += inSz;
  try {
    execFileSync(ffmpegPath, [
      '-y', '-i', src,
      '-c:v', 'libx264', '-crf', String(VID_CRF), '-preset', 'medium',
      '-vf', `scale=-2:${VID_HEIGHT}`,
      '-an',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      dst,
    ], { stdio: 'ignore' });
    const outSz = statSync(dst).size;
    vOut += outSz;
    console.log(`  OK   ${dstName.padEnd(13)} ${String((inSz / 1024).toFixed(0)).padStart(5)}KB -> ${String((outSz / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outSz / inSz) * 100).toFixed(0)}%)`);
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log(`  ERR ${srcName}: ${e.message}`); }
}
console.log(`Total videos : ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB (-${vIn > 0 ? ((1 - vOut / vIn) * 100).toFixed(0) : 0}%)`);

// Nettoyage : supprimer le dossier src/ s'il est vide
try {
  const remain = readdirSync(SRC_DIR);
  if (remain.length === 0) { rmdirSync(SRC_DIR); console.log('\nDossier src/ supprime'); }
  else { console.log(`\nDossier src/ conserve (${remain.length} fichiers restants : ${remain.join(', ')})`); }
} catch {}

console.log(`\n=== TOTAL ===`);
const total = iIn + vIn, totalOut = iOut + vOut;
console.log(`${(total / 1024 / 1024).toFixed(2)}MB -> ${(totalOut / 1024 / 1024).toFixed(2)}MB (-${((1 - totalOut / total) * 100).toFixed(0)}%)`);
