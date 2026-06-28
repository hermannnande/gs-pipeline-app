/**
 * Compression des medias de la landing creme-ongle-incarne-v2.
 *  - Images PNG -> webp (resize + qualite) via sharp
 *  - Videos mp4 -> recompression H.264 (cap largeur, CRF, sans audio, faststart) via ffmpeg
 *  - Poster hero extrait de la 1ere frame de la video hero
 *
 * Usage : node scripts/optimize-ongle-v2.mjs
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPkg from '@ffmpeg-installer/ffmpeg';

const DIR = 'frontend/public/ongle-incarne-v2';
const RAW = join(DIR, '_raw');
const FFMPEG = ffmpegPkg.path;

const kb = (p) => (statSync(p).size / 1024).toFixed(0);

// ---- Images : PNG -> webp ----
const IMAGES = [
  ['ChatGPT-Image-4-juin-2026-20_44_41.png', 'i1.webp'],
  ['ChatGPT-Image-4-juin-2026-20_44_36.png', 'i2.webp'],
  ['ChatGPT-Image-4-juin-2026-20_44_54.png', 'i3.webp'],
  ['ChatGPT-Image-4-juin-2026-21_06_10.png', 'i4.webp'],
  ['ChatGPT-Image-4-juin-2026-21_06_05.png', 'i5.webp'],
  ['ChatGPT-Image-4-juin-2026-21_05_59.png', 'i6.webp'],
];

// ---- Videos : mp4 -> mp4 optimise ----
const VIDEOS = [
  ['r1-2.mp4', 'hero.mp4'],
  ['R1-1.mp4', 'v2.mp4'],
  ['r1.mp4', 'v3.mp4'],
  ['r4.mp4', 'v4.mp4'],
];

async function images() {
  console.log('\n=== Images -> webp ===');
  for (const [src, out] of IMAGES) {
    const inPath = join(RAW, src);
    const outPath = join(DIR, out);
    const before = kb(inPath);
    await sharp(inPath)
      .resize(1000, null, { withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(outPath);
    console.log(`  ${out}: ${before} KB -> ${kb(outPath)} KB`);
  }
}

function videos() {
  console.log('\n=== Videos -> mp4 optimise (sans audio) ===');
  for (const [src, out] of VIDEOS) {
    const inPath = join(RAW, src);
    const outPath = join(DIR, out);
    const before = kb(inPath);
    execFileSync(FFMPEG, [
      '-y', '-i', inPath,
      '-vf', "scale='min(720,iw)':-2",
      '-c:v', 'libx264',
      '-profile:v', 'main',
      '-preset', 'veryfast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      outPath,
    ], { stdio: 'pipe' });
    console.log(`  ${out}: ${before} KB -> ${kb(outPath)} KB`);
  }
}

function poster() {
  console.log('\n=== Poster hero ===');
  const tmpPng = join(DIR, '_poster.png');
  execFileSync(FFMPEG, ['-y', '-i', join(DIR, 'hero.mp4'), '-vframes', '1', '-q:v', '2', tmpPng], { stdio: 'pipe' });
  return tmpPng;
}

async function run() {
  await images();
  videos();
  const tmpPng = poster();
  await sharp(tmpPng).resize(720, null, { withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(join(DIR, 'hero-poster.webp'));
  console.log(`  hero-poster.webp: ${kb(join(DIR, 'hero-poster.webp'))} KB`);
  try { execFileSync(process.platform === 'win32' ? 'cmd' : 'rm', process.platform === 'win32' ? ['/c', 'del', tmpPng.replace(/\//g, '\\')] : ['-f', tmpPng]); } catch { /* noop */ }
  console.log('\nDone.\n');
}

run().catch((e) => { console.error(e); process.exit(1); });
