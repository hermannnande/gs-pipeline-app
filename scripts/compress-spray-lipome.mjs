/**
 * Compression spray-lipome :
 *   - PNG/JPG -> WebP Q=52, max 800px
 *   - MP4 -> H264 CRF 32, 540p, audio retire
 *   - Sources dans raw/ -> sorties dans le dossier parent
 *   - raw/ supprime apres compression
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { readdirSync, readFileSync, statSync, writeFileSync, unlinkSync, existsSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const SRC_DIR = 'frontend/public/spray-lipome/raw';
const DST_DIR = 'frontend/public/spray-lipome';
const ffmpegPath = ffmpegInstaller.path;

const IMG_Q = 52;
const IMG_MAX_W = 800;
const VID_CRF = 32;
const VID_HEIGHT = 540;

console.log('\n=== IMAGES (Q=' + IMG_Q + ', maxW=' + IMG_MAX_W + ') ===');
let iIn = 0, iOut = 0;
const imgFiles = readdirSync(SRC_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));
for (const f of imgFiles) {
  const src = join(SRC_DIR, f);
  const outName = f.replace(/\.(png|jpe?g)$/i, '.webp');
  const out = join(DST_DIR, outName);
  const inBuf = readFileSync(src);
  iIn += inBuf.length;
  try {
    const s = sharp(inBuf).rotate();
    const meta = await s.metadata();
    const w = meta.width && meta.width > IMG_MAX_W ? IMG_MAX_W : meta.width;
    const outBuf = await s.resize({ width: w, withoutEnlargement: true })
      .webp({ quality: IMG_Q, effort: 6, smartSubsample: true })
      .toBuffer();
    writeFileSync(out, outBuf);
    iOut += outBuf.length;
    console.log(`  OK   ${outName.padEnd(15)} ${String((inBuf.length / 1024).toFixed(0)).padStart(5)}KB -> ${String((outBuf.length / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outBuf.length / inBuf.length) * 100).toFixed(0)}%)`);
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log(`  ERR ${f}: ${e.message}`); }
}
console.log(`Images : ${(iIn / 1024).toFixed(0)}KB -> ${(iOut / 1024).toFixed(0)}KB (-${((1 - iOut / iIn) * 100).toFixed(0)}%)`);

console.log(`\n=== VIDEOS (CRF=${VID_CRF}, ${VID_HEIGHT}p, no audio) ===`);
let vIn = 0, vOut = 0;
const vidFiles = readdirSync(SRC_DIR).filter(f => /\.mp4$/i.test(f));
for (const f of vidFiles) {
  const src = join(SRC_DIR, f);
  const out = join(DST_DIR, f);
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
      out,
    ], { stdio: 'ignore' });
    const outSz = statSync(out).size;
    vOut += outSz;
    console.log(`  OK   ${f.padEnd(13)} ${String((inSz / 1024).toFixed(0)).padStart(5)}KB -> ${String((outSz / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outSz / inSz) * 100).toFixed(0)}%)`);
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log('  ERR', f, e.message); }
}
console.log(`Videos : ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB (-${vIn > 0 ? ((1 - vOut / vIn) * 100).toFixed(0) : 0}%)`);

// Nettoyer le dossier raw/
try {
  const remain = readdirSync(SRC_DIR);
  if (remain.length === 0) { rmdirSync(SRC_DIR); console.log('\nDossier raw/ supprime'); }
} catch {}

console.log(`\n=== TOTAL ===`);
console.log(`${((iIn + vIn) / 1024).toFixed(0)}KB -> ${((iOut + vOut) / 1024).toFixed(0)}KB (-${((1 - (iOut + vOut) / (iIn + vIn)) * 100).toFixed(0)}%)`);
