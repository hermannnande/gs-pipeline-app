/**
 * Télécharge + compresse les médias de la landing chapeau-dame (CHEAPEAU_DAME).
 *
 * - Images PNG (lourdes) -> webp optimisé qualité 82, largeur max 1080
 * - Vidéos MP4 -> H.264 720p sans audio (autoplay muet) + faststart
 * - Génère hero-poster.webp depuis la vidéo hero.
 *
 * Sortie : frontend/public/chapeau-dame/ (servie sur /chapeau-dame/...)
 * Usage  : node scripts/optimize-chapeau-dame.mjs
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import ffmpegPkg from '@ffmpeg-installer/ffmpeg';

const DIR = 'frontend/public/chapeau-dame';
const RAW = join(DIR, '_raw');
const FFMPEG = ffmpegPkg.path;
const BASE = 'https://obrille.com/wp-content/uploads/2026/06';
const kb = (p) => (statSync(p).size / 1024).toFixed(0);

mkdirSync(RAW, { recursive: true });

// [nom distant, fichier brut, sortie optimisee]
const IMAGES = [
  ['ChatGPT-Image-15-juin-2026-21_12_45.png', 'i1.src', 'i1.webp'],
  ['ChatGPT-Image-15-juin-2026-21_12_56.png', 'i2.src', 'i2.webp'],
  ['ChatGPT-Image-15-juin-2026-21_13_04.png', 'i3.src', 'i3.webp'],
  ['ChatGPT-Image-15-juin-2026-21_13_19.png', 'i4.src', 'i4.webp'],
  ['ChatGPT-Image-15-juin-2026-21_13_37.png', 'i5.src', 'i5.webp'],
  ['ChatGPT-Image-15-juin-2026-21_13_28.png', 'i6.src', 'i6.webp'],
  ['ChatGPT-Image-15-juin-2026-21_45_56-1.png', 'i7.src', 'i7.webp'],
];

const VIDEOS = [
  ['GI-5.mp4', 'v1.src.mp4', 'v1.mp4'],
  ['Ma-video-13.mp4', 'v2.src.mp4', 'v2.mp4'],
];

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) { console.log(`  skip: ${dest}`); return; }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(`  ok: ${dest} (${kb(dest)} Ko)`);
}

async function run() {
  console.log('=== Téléchargement des médias bruts ===');
  for (const [name, raw] of IMAGES) await download(`${BASE}/${name}`, join(RAW, raw));
  for (const [name, raw] of VIDEOS) await download(`${BASE}/${name}`, join(RAW, raw));

  console.log('\n=== Images -> webp ===');
  let imgBefore = 0, imgAfter = 0;
  for (const [, raw, out] of IMAGES) {
    const inPath = join(RAW, raw), outPath = join(DIR, out);
    imgBefore += statSync(inPath).size;
    await sharp(inPath).resize(1080, null, { withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(outPath);
    imgAfter += statSync(outPath).size;
    console.log(`  ${out}: ${kb(inPath)} Ko -> ${kb(outPath)} Ko`);
  }

  console.log('\n=== Vidéos -> mp4 720p (sans audio) ===');
  let vidBefore = 0, vidAfter = 0;
  for (const [, raw, out] of VIDEOS) {
    const inPath = join(RAW, raw), outPath = join(DIR, out);
    vidBefore += statSync(inPath).size;
    execFileSync(FFMPEG, [
      '-y', '-i', inPath,
      '-vf', "scale='min(720,iw)':-2",
      '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'veryfast', '-crf', '30',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', outPath,
    ], { stdio: 'pipe' });
    vidAfter += statSync(outPath).size;
    console.log(`  ${out}: ${kb(inPath)} Ko -> ${kb(outPath)} Ko`);
  }

  console.log('\n=== Poster hero ===');
  const tmpPng = join(DIR, '_poster.png');
  execFileSync(FFMPEG, ['-y', '-i', join(DIR, 'v1.mp4'), '-vframes', '1', '-q:v', '2', tmpPng], { stdio: 'pipe' });
  await sharp(tmpPng).resize(720).webp({ quality: 76 }).toFile(join(DIR, 'hero-poster.webp'));
  unlinkSync(tmpPng);
  console.log(`  hero-poster.webp: ${kb(join(DIR, 'hero-poster.webp'))} Ko`);

  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  console.log('\n=== RÉSUMÉ ===');
  console.log(`  Images : ${mb(imgBefore)} Mo -> ${mb(imgAfter)} Mo`);
  console.log(`  Vidéos : ${mb(vidBefore)} Mo -> ${mb(vidAfter)} Mo`);
  console.log(`  TOTAL  : ${mb(imgBefore + vidBefore)} Mo -> ${mb(imgAfter + vidAfter)} Mo`);
  console.log('\nOK. Déployer : node scripts/deploy-vps.mjs --with-images');
}

run().catch((e) => { console.error(e); process.exit(1); });
