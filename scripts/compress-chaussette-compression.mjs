/**
 * Compresse les medias chaussette-compression : PNG/JPG/WEBP -> WebP, MP4 -> H264 480p muet.
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { readFileSync, writeFileSync, statSync, existsSync, unlinkSync, readdirSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC_DIR = 'frontend/public/chaussette-compression/raw';
const DST_DIR = 'frontend/public/chaussette-compression';
const ffmpegPath = ffmpegInstaller.path;

const IMAGES = [
  ['m1.png', 'hero.webp', { w: 760, q: 72 }],
  ['m2.png', 'm2.webp', { w: 700, q: 66 }],
  ['m3.png', 'm3.webp', { w: 700, q: 66 }],
  ['m4.png', 'm4.webp', { w: 700, q: 66 }],
  ['m5.png', 'm5.webp', { w: 700, q: 66 }],
  ['m6.png', 'm6.webp', { w: 700, q: 66 }],
  ['m7.png', 'm7.webp', { w: 700, q: 66 }],
  ['m8.webp', 'm8.webp', { w: 700, q: 66 }],
  ['m9.png', 'm9.webp', { w: 700, q: 66 }],
  ['m10.webp', 'm10.webp', { w: 700, q: 66 }],
  ['m11.webp', 'm11.webp', { w: 700, q: 66 }],
  ['m12.webp', 'm12.webp', { w: 700, q: 66 }],
  ['m13.webp', 'm13.webp', { w: 700, q: 66 }],
  ['m14.webp', 'm14.webp', { w: 700, q: 66 }],
  ['m15.jpeg', 'm15.webp', { w: 700, q: 66 }],
];
const VIDEOS = [['v1.mp4', 'v1.mp4']];

console.log('\n=== IMAGES ===');
let iIn = 0, iOut = 0;
for (const [srcName, dstName, { w, q }] of IMAGES) {
  const src = join(SRC_DIR, srcName);
  const dst = join(DST_DIR, dstName);
  if (!existsSync(src)) { console.log(`  SKIP ${srcName}`); continue; }
  const inBuf = readFileSync(src);
  iIn += inBuf.length;
  const outBuf = await sharp(inBuf).rotate()
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: q, effort: 6, smartSubsample: true })
    .toBuffer();
  writeFileSync(dst, outBuf);
  iOut += outBuf.length;
  console.log(`  OK ${dstName.padEnd(10)} ${(inBuf.length / 1024).toFixed(0)}KB -> ${(outBuf.length / 1024).toFixed(0)}KB`);
}

console.log('\n=== VIDEO ===');
let vIn = 0, vOut = 0;
for (const [srcName, dstName] of VIDEOS) {
  const src = join(SRC_DIR, srcName);
  const dst = join(DST_DIR, dstName);
  if (!existsSync(src)) { console.log(`  SKIP ${srcName}`); continue; }
  vIn += statSync(src).size;
  execFileSync(ffmpegPath, [
    '-y', '-i', src,
    '-c:v', 'libx264', '-crf', '32', '-preset', 'medium',
    '-vf', 'scale=-2:480',
    '-an', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    dst,
  ], { stdio: 'ignore' });
  vOut += statSync(dst).size;
  console.log(`  OK ${dstName} ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB`);
}

try {
  for (const f of readdirSync(SRC_DIR)) unlinkSync(join(SRC_DIR, f));
  rmdirSync(SRC_DIR);
  console.log('\nraw/ supprime');
} catch {}

console.log(`\nTotal : ${((iIn + vIn) / 1024 / 1024).toFixed(2)}MB -> ${((iOut + vOut) / 1024 / 1024).toFixed(2)}MB`);
