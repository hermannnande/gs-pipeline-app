/**
 * Télécharge les médias juillet 2026 de serum-cerne,
 * convertit les images en WebP et compresse la vidéo d'application.
 *
 * Usage : node scripts/compress-serum-cerne.mjs
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { mkdirSync, writeFileSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const BASE = 'https://obrille.com/wp-content/uploads/2026/07/';
const OUT = resolve('frontend/public/serum-cerne-media');
const ffmpegPath = ffmpegInstaller.path;

mkdirSync(OUT, { recursive: true });

const IMAGES = [
  { remote: 'ChatGPT-Image-15-juil.-2026-22_17_17.png', local: 'hero.webp', maxW: 960, q: 72 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_15_05.png', local: 'problem.webp', maxW: 820, q: 65 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_15_15.png', local: 'solution.webp', maxW: 820, q: 65 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_15_10.png', local: 'formula.webp', maxW: 820, q: 65 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_14_33.png', local: 'glow.webp', maxW: 820, q: 65 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_14_33.png', local: 'apres.webp', maxW: 820, q: 65 },
  { remote: 'ChatGPT-Image-15-juil.-2026-18_14_54-1.png', local: 'avant.webp', maxW: 820, q: 65 },
];

const VIDEO = {
  remote: 'Dame_applique_serum_anti_age_202607152016.mp4',
  local: 'video-app.mp4',
  crf: 30,
  height: 720,
};

let totalBefore = 0;
let totalAfter = 0;

console.log('\n=== IMAGES WebP ===');
for (const f of IMAGES) {
  const url = BASE + f.remote;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  totalBefore += buf.length;

  const out = await sharp(buf)
    .rotate()
    .resize({ width: f.maxW, withoutEnlargement: true })
    .webp({ quality: f.q, effort: 6, smartSubsample: true })
    .toBuffer();

  writeFileSync(join(OUT, f.local), out);
  totalAfter += out.length;
  console.log(`${f.local.padEnd(14)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB -> ${(out.length / 1024).toFixed(0).padStart(4)} KB`);
}

console.log('\n=== VIDEO MP4 ===');
const videoUrl = BASE + VIDEO.remote;
const videoRes = await fetch(videoUrl);
if (!videoRes.ok) throw new Error(`${videoUrl} -> ${videoRes.status}`);
const videoBuf = Buffer.from(await videoRes.arrayBuffer());
const rawPath = join(tmpdir(), `sc-raw-${Date.now()}.mp4`);
const outPath = join(OUT, VIDEO.local);
writeFileSync(rawPath, videoBuf);
totalBefore += videoBuf.length;

try {
  execFileSync(ffmpegPath, [
    '-y', '-i', rawPath,
    '-c:v', 'libx264', '-crf', String(VIDEO.crf), '-preset', 'medium',
    '-vf', `scale=-2:${VIDEO.height}`,
    '-an',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    outPath,
  ], { stdio: 'ignore' });

  const posterPath = join(OUT, 'video-app-poster.webp');
  const posterRaw = join(tmpdir(), `sc-poster-${Date.now()}.jpg`);
  execFileSync(ffmpegPath, [
    '-y', '-i', outPath,
    '-vframes', '1',
    '-q:v', '2',
    posterRaw,
  ], { stdio: 'ignore' });

  const posterBuf = await sharp(posterRaw)
    .resize({ width: 540, withoutEnlargement: true })
    .webp({ quality: 68, effort: 6 })
    .toBuffer();
  writeFileSync(posterPath, posterBuf);
  try { unlinkSync(posterRaw); } catch {}

  const outSz = statSync(outPath).size;
  totalAfter += outSz + posterBuf.length;
  console.log(`${VIDEO.local.padEnd(14)} ${(videoBuf.length / 1024).toFixed(0).padStart(5)} KB -> ${(outSz / 1024).toFixed(0).padStart(4)} KB`);
  console.log(`video-app-poster.webp  poster ${(posterBuf.length / 1024).toFixed(0)} KB`);
} finally {
  try { unlinkSync(rawPath); } catch {}
}

console.log('\n---');
console.log(`Total : ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB (gain ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
console.log(`Dossier : ${OUT}`);
