/**
 * Compression médias landing crememinceurfb.
 * Usage : node scripts/optimize-creme-minceur-fb.mjs
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPkg from '@ffmpeg-installer/ffmpeg';

const DIR = 'frontend/public/creme-minceur-fb';
const RAW = join(DIR, '_raw');
const FFMPEG = ffmpegPkg.path;
const kb = (p) => (statSync(p).size / 1024).toFixed(0);

const IMAGES = [
  ['img-new-1.png', 'i1.webp'],
  ['img-new-2.png', 'i2.webp'],
  ['img-new-3.png', 'i3.webp'],
  ['gallery-1.webp', 'i4.webp'],
  ['gallery-2.webp', 'i5.webp'],
  ['gallery-3.webp', 'i6.webp'],
  ['avant.webp', 'i7.webp'],
  ['apres.webp', 'i8.webp'],
];

const VIDEOS = [
  ['r2.mp4', 'hero.mp4'],
  ['r1-3.mp4', 'v1.mp4'],
  ['video-1.mp4', 'v2.mp4'],
  ['video-2.mp4', 'v3.mp4'],
  ['video-3.mp4', 'v4.mp4'],
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
  console.log('\n=== Videos -> mp4 optimise ===');
  for (const [src, out] of VIDEOS) {
    const inPath = join(RAW, src);
    const outPath = join(DIR, out);
    const before = kb(inPath);
    execFileSync(FFMPEG, [
      '-y', '-i', inPath,
      '-vf', "scale='min(720,iw)':-2",
      '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'veryfast', '-crf', '28',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', outPath,
    ], { stdio: 'pipe' });
    console.log(`  ${out}: ${before} KB -> ${kb(outPath)} KB`);
  }
}

async function poster() {
  const tmpPng = join(DIR, '_poster.png');
  execFileSync(FFMPEG, ['-y', '-i', join(DIR, 'hero.mp4'), '-vframes', '1', '-q:v', '2', tmpPng], { stdio: 'pipe' });
  await sharp(tmpPng).webp({ quality: 72 }).toFile(join(DIR, 'hero-poster.webp'));
  unlinkSync(tmpPng);
  console.log(`\n  hero-poster.webp: ${kb(join(DIR, 'hero-poster.webp'))} KB`);
}

await images();
videos();
await poster();
console.log('\nOK');
