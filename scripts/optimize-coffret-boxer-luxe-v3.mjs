/**
 * Télécharge + compresse les médias de la landing coffret-boxer-luxe-v3.
 *
 * - Images WordPress (JPEG ~500-770 Ko) -> webp optimisé (~40-90 Ko)
 * - Vidéos WordPress (MP4 ~1.1-1.3 Mo) -> mp4 H.264 720p sans audio (~300-500 Ko)
 * - Génère hero-poster.webp depuis la vidéo hero.
 *
 * Sortie : frontend/public/coffret-boxer-luxe-v3/ (servie sur /coffret-boxer-luxe-v3/...)
 * Usage  : node scripts/optimize-coffret-boxer-luxe-v3.mjs
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import ffmpegPkg from '@ffmpeg-installer/ffmpeg';

const DIR = 'frontend/public/coffret-boxer-luxe-v3';
const RAW = join(DIR, '_raw');
const FFMPEG = ffmpegPkg.path;
const BASE = 'https://obrille.com/wp-content/uploads/2026/06';
const kb = (p) => (statSync(p).size / 1024).toFixed(0);

mkdirSync(RAW, { recursive: true });

// [url distante, fichier brut, sortie optimisee]
const IMAGES = [
  ['Affiche_pub_boxer_homme_noir_202606141407-1.jpeg', 'noir1.src', 'noir1.webp'],
  ['Affiche_pub_boxer_homme_CTA_202606141405-1.jpeg', 'cta1.src', 'cta1.webp'],
  ['Affiche_pub_boxer_homme_CTA_202606141405.jpeg', 'cta2.src', 'cta2.webp'],
  ['Affiche_pub_boxer_homme_noir_202606141407.jpeg', 'noir2.src', 'noir2.webp'],
  ['Photo_pub_boxer_pack_pro_202606142203.jpeg', 'pro1.src', 'pro1.webp'],
  ['Photo_pub_boxer_pack_pro_202606142203-1.jpeg', 'pro2.src', 'pro2.webp'],
  ['Photo_pub_boxer_pack_pro_202606142203-2.jpeg', 'pro3.src', 'pro3.webp'],
  ['Photo_pub_boxer_pack_pro_202606142204.jpeg', 'pro4.src', 'pro4.webp'],
];

const VIDEOS = [
  ['fait_une_video_pub_202606142214.mp4', 'vid2.src.mp4', 'vid2.mp4'],
  ['fait_une_video_pub_202606142214-1.mp4', 'vid1.src.mp4', 'vid1.mp4'],
];

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`  skip (existe): ${dest}`);
    return;
  }
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
    const inPath = join(RAW, raw);
    const outPath = join(DIR, out);
    imgBefore += statSync(inPath).size;
    await sharp(inPath)
      .resize(1080, null, { withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(outPath);
    imgAfter += statSync(outPath).size;
    console.log(`  ${out}: ${kb(inPath)} Ko -> ${kb(outPath)} Ko`);
  }

  console.log('\n=== Vidéos -> mp4 720p (sans audio) ===');
  let vidBefore = 0, vidAfter = 0;
  for (const [, raw, out] of VIDEOS) {
    const inPath = join(RAW, raw);
    const outPath = join(DIR, out);
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
  execFileSync(FFMPEG, ['-y', '-i', join(DIR, 'vid2.mp4'), '-vframes', '1', '-q:v', '2', tmpPng], { stdio: 'pipe' });
  await sharp(tmpPng).resize(720).webp({ quality: 74 }).toFile(join(DIR, 'hero-poster.webp'));
  unlinkSync(tmpPng);
  console.log(`  hero-poster.webp: ${kb(join(DIR, 'hero-poster.webp'))} Ko`);

  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  console.log('\n=== RÉSUMÉ ===');
  console.log(`  Images : ${mb(imgBefore)} Mo -> ${mb(imgAfter)} Mo`);
  console.log(`  Vidéos : ${mb(vidBefore)} Mo -> ${mb(vidAfter)} Mo`);
  console.log(`  TOTAL  : ${mb(imgBefore + vidBefore)} Mo -> ${mb(imgAfter + vidAfter)} Mo`);
  console.log('\nOK. Pense à déployer : node scripts/deploy-vps.mjs --with-images');
}

run().catch((e) => { console.error(e); process.exit(1); });
