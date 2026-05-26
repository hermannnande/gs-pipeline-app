/**
 * Compression ultra-agressive pour la landing spraydouleurtk.
 *   - Images : WebP Q=55, max 900px
 *   - Video  : H264 CRF 32, 540p, preset medium, audio retire
 * Strategie Windows-safe : buffer -> tmp -> subprocess swap.
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import {
  readFileSync, writeFileSync, statSync, existsSync,
  unlinkSync, renameSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const DIR = 'frontend/public/spray-douleur';
const ffmpegPath = ffmpegInstaller.path;

const IMAGES = ['hero.webp', 'gallery-1.webp', 'gallery-2.webp', 'gallery-3.webp', 'usage.webp', 'avant.webp', 'apres.webp'];
const VIDEOS = ['video-1.mp4'];

const IMG_Q = 55;
const IMG_MAX_W = 900;
const VID_CRF = 32;
const VID_HEIGHT = 540;

function atomicSwap(tmpPath, finalPath) {
  const swap = `
import { unlinkSync, renameSync, existsSync } from 'node:fs';
for (let i = 0; i < 5; i++) {
  try {
    if (existsSync(${JSON.stringify(finalPath)})) unlinkSync(${JSON.stringify(finalPath)});
    renameSync(${JSON.stringify(tmpPath)}, ${JSON.stringify(finalPath)});
    process.exit(0);
  } catch (e) {
    if (i === 4) { console.error('SWAP', e.message); process.exit(1); }
    const end = Date.now() + 300; while (Date.now() < end) {}
  }
}
`;
  const runner = join(tmpdir(), `sp-swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mjs`);
  writeFileSync(runner, swap);
  try {
    execFileSync(process.execPath, [runner], { stdio: 'inherit' });
    return true;
  } catch { return false; }
  finally { try { unlinkSync(runner); } catch {} }
}

console.log('\n=== IMAGES (Q=' + IMG_Q + ', maxW=' + IMG_MAX_W + ') ===');
let iIn = 0, iOut = 0;
for (const img of IMAGES) {
  const src = join(DIR, img);
  if (!existsSync(src)) { console.log('  MISS', img); continue; }
  const inBuf = readFileSync(src);
  iIn += inBuf.length;
  try {
    const s = sharp(inBuf).rotate();
    const meta = await s.metadata();
    const w = meta.width && meta.width > IMG_MAX_W ? IMG_MAX_W : meta.width;
    const outBuf = await s.resize({ width: w, withoutEnlargement: true })
      .webp({ quality: IMG_Q, effort: 6, smartSubsample: true })
      .toBuffer();
    if (outBuf.length >= inBuf.length) {
      console.log(`  SKIP ${img.padEnd(16)} (${(inBuf.length / 1024).toFixed(0)}KB deja optimal)`);
      iOut += inBuf.length;
      continue;
    }
    const tmp = join(tmpdir(), `sp-img-${Date.now()}-${img}`);
    writeFileSync(tmp, outBuf);
    if (!atomicSwap(tmp, src)) { console.log('  FAIL', img); iOut += inBuf.length; continue; }
    iOut += outBuf.length;
    console.log(`  OK   ${img.padEnd(16)} ${String((inBuf.length / 1024).toFixed(0)).padStart(4)}KB -> ${String((outBuf.length / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outBuf.length / inBuf.length) * 100).toFixed(0)}%)`);
  } catch (e) { console.log(`  ERR ${img}: ${e.message}`); iOut += inBuf.length; }
}
console.log(`Images : ${(iIn / 1024).toFixed(0)}KB -> ${(iOut / 1024).toFixed(0)}KB (-${((1 - iOut / iIn) * 100).toFixed(0)}%)`);

console.log(`\n=== VIDEOS (CRF=${VID_CRF}, ${VID_HEIGHT}p, no audio) ===`);
let vIn = 0, vOut = 0;
for (const vid of VIDEOS) {
  const src = join(DIR, vid);
  if (!existsSync(src)) { console.log('  MISS', vid); continue; }
  const inSz = statSync(src).size;
  vIn += inSz;
  const tmp = join(tmpdir(), `sp-vid-${Date.now()}-${vid}`);
  try {
    execFileSync(ffmpegPath, [
      '-y', '-i', src,
      '-c:v', 'libx264', '-crf', String(VID_CRF), '-preset', 'medium',
      '-vf', `scale=-2:${VID_HEIGHT}`,
      '-an',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      tmp,
    ], { stdio: 'ignore' });
    if (!existsSync(tmp)) { console.log('  FAIL (no output)', vid); vOut += inSz; continue; }
    const outSz = statSync(tmp).size;
    if (outSz >= inSz) { try { unlinkSync(tmp); } catch {} console.log(`  SKIP ${vid}`); vOut += inSz; continue; }
    if (!atomicSwap(tmp, src)) { console.log('  FAIL', vid); vOut += inSz; continue; }
    vOut += outSz;
    console.log(`  OK   ${vid.padEnd(14)} ${String((inSz / 1024).toFixed(0)).padStart(4)}KB -> ${String((outSz / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outSz / inSz) * 100).toFixed(0)}%)`);
  } catch (e) { console.log('  ERR', vid, e.message); vOut += inSz; try { if (existsSync(tmp)) unlinkSync(tmp); } catch {} }
}
console.log(`Videos : ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB (-${vIn > 0 ? ((1 - vOut / vIn) * 100).toFixed(0) : 0}%)`);

console.log(`\n=== TOTAL ===`);
console.log(`${((iIn + vIn) / 1024).toFixed(0)}KB -> ${((iOut + vOut) / 1024).toFixed(0)}KB (-${((1 - (iOut + vOut) / (iIn + vIn)) * 100).toFixed(0)}%)`);
