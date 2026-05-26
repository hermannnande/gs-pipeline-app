/**
 * Compression ULTRA-agressive v2 pour spray-lipome.
 *   - Images : WebP Q=45, max 700px (suffit amplement pour mobile retina)
 *   - Videos : H264 CRF=34, 480p, preset slow (meilleure compression), audio retire
 * Strategie Windows-safe : buffer -> tmp -> subprocess swap.
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import {
  readFileSync, writeFileSync, statSync, existsSync,
  unlinkSync, renameSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const DIR = 'frontend/public/spray-lipome';
const ffmpegPath = ffmpegInstaller.path;

const IMG_Q = 45;
const IMG_MAX_W = 700;
const VID_CRF = 34;
const VID_HEIGHT = 480;

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
  const runner = join(tmpdir(), `sl-swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mjs`);
  writeFileSync(runner, swap);
  try {
    execFileSync(process.execPath, [runner], { stdio: 'inherit' });
    return true;
  } catch { return false; }
  finally { try { unlinkSync(runner); } catch {} }
}

const files = readdirSync(DIR);
const IMAGES = files.filter(f => /\.webp$/i.test(f));
const VIDEOS = files.filter(f => /\.mp4$/i.test(f));

console.log('\n=== IMAGES (Q=' + IMG_Q + ', maxW=' + IMG_MAX_W + ') ===');
let iIn = 0, iOut = 0;
for (const img of IMAGES) {
  const src = join(DIR, img);
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
    const tmp = join(tmpdir(), `sl-img-${Date.now()}-${img}`);
    writeFileSync(tmp, outBuf);
    if (!atomicSwap(tmp, src)) { console.log('  FAIL', img); iOut += inBuf.length; continue; }
    iOut += outBuf.length;
    console.log(`  OK   ${img.padEnd(16)} ${String((inBuf.length / 1024).toFixed(0)).padStart(4)}KB -> ${String((outBuf.length / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outBuf.length / inBuf.length) * 100).toFixed(0)}%)`);
  } catch (e) { console.log(`  ERR ${img}: ${e.message}`); iOut += inBuf.length; }
}
console.log(`Images : ${(iIn / 1024).toFixed(0)}KB -> ${(iOut / 1024).toFixed(0)}KB (-${((1 - iOut / iIn) * 100).toFixed(0)}%)`);

console.log(`\n=== VIDEOS (CRF=${VID_CRF}, ${VID_HEIGHT}p, preset slow) ===`);
let vIn = 0, vOut = 0;
for (const vid of VIDEOS) {
  const src = join(DIR, vid);
  const inSz = statSync(src).size;
  vIn += inSz;
  const tmp = join(tmpdir(), `sl-vid-${Date.now()}-${vid}`);
  try {
    execFileSync(ffmpegPath, [
      '-y', '-i', src,
      '-c:v', 'libx264', '-crf', String(VID_CRF), '-preset', 'slow',
      '-vf', `scale=-2:${VID_HEIGHT}`,
      '-an',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'main', '-level', '3.1',
      tmp,
    ], { stdio: 'ignore' });
    if (!existsSync(tmp)) { console.log('  FAIL (no output)', vid); vOut += inSz; continue; }
    const outSz = statSync(tmp).size;
    if (outSz >= inSz) { try { unlinkSync(tmp); } catch {} console.log(`  SKIP ${vid} (deja optimal)`); vOut += inSz; continue; }
    if (!atomicSwap(tmp, src)) { console.log('  FAIL', vid); vOut += inSz; continue; }
    vOut += outSz;
    console.log(`  OK   ${vid.padEnd(13)} ${String((inSz / 1024).toFixed(0)).padStart(4)}KB -> ${String((outSz / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outSz / inSz) * 100).toFixed(0)}%)`);
  } catch (e) { console.log('  ERR', vid, e.message); vOut += inSz; try { if (existsSync(tmp)) unlinkSync(tmp); } catch {} }
}
console.log(`Videos : ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB (-${vIn > 0 ? ((1 - vOut / vIn) * 100).toFixed(0) : 0}%)`);

console.log(`\n=== TOTAL ===`);
console.log(`${((iIn + vIn) / 1024).toFixed(0)}KB -> ${((iOut + vOut) / 1024).toFixed(0)}KB (-${((1 - (iOut + vOut) / (iIn + vIn)) * 100).toFixed(0)}%)`);
