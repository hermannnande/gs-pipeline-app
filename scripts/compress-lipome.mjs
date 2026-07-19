/**
 * Compression crème anti-lipome :
 *   - PNG/JPG dans raw/ -> WebP Q=52, max 800px -> n1..n9.webp
 *   - MP4 dans raw/ -> H264 CRF 32, 540p, no audio -> w1/w2.mp4
 *   - Posters vidéo -> w1p.webp, w2p.webp (frame 1)
 *
 * Usage : node scripts/compress-lipome.mjs
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { readdirSync, readFileSync, statSync, writeFileSync, unlinkSync, existsSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC_DIR = 'frontend/public/lipome/raw';
const DST_DIR = 'frontend/public/lipome';
const ffmpegPath = ffmpegInstaller.path;

const IMG_Q = 52;
const IMG_MAX_W = 800;
const VID_CRF = 32;
const VID_HEIGHT = 540;

if (!existsSync(SRC_DIR)) {
  console.log('Aucun dossier raw/ — médias déjà compressés.');
  process.exit(0);
}

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
    console.log(`  OK   ${outName.padEnd(12)} ${String((inBuf.length / 1024).toFixed(0)).padStart(5)}KB -> ${String((outBuf.length / 1024).toFixed(0)).padStart(4)}KB`);
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log(`  ERR ${f}: ${e.message}`); }
}
if (imgFiles.length) console.log(`Images : ${(iIn / 1024).toFixed(0)}KB -> ${(iOut / 1024).toFixed(0)}KB`);

console.log(`\n=== VIDEOS (CRF=${VID_CRF}, ${VID_HEIGHT}p) ===`);
let vIn = 0, vOut = 0;
const vidFiles = readdirSync(SRC_DIR).filter(f => /\.mp4$/i.test(f));
for (const f of vidFiles) {
  const src = join(SRC_DIR, f);
  const out = join(DST_DIR, f);
  const posterOut = join(DST_DIR, f.replace('.mp4', 'p.webp'));
  const inSz = statSync(src).size;
  vIn += inSz;
  try {
    execFileSync(ffmpegPath, [
      '-y', '-i', src,
      '-c:v', 'libx264', '-crf', String(VID_CRF), '-preset', 'medium',
      '-vf', `scale=-2:${VID_HEIGHT}`,
      '-an', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      out,
    ], { stdio: 'ignore' });
    const outSz = statSync(out).size;
    vOut += outSz;
    console.log(`  OK   ${f.padEnd(10)} ${String((inSz / 1024).toFixed(0)).padStart(5)}KB -> ${String((outSz / 1024).toFixed(0)).padStart(4)}KB`);
    try {
      const tmpPoster = join(DST_DIR, '_tmp_poster.png');
      execFileSync(ffmpegPath, ['-y', '-i', out, '-vframes', '1', '-vf', 'scale=400:-2', tmpPoster], { stdio: 'ignore' });
      const posterBuf = await sharp(tmpPoster).webp({ quality: 60 }).toBuffer();
      writeFileSync(posterOut, posterBuf);
      try { unlinkSync(tmpPoster); } catch {}
      console.log(`       poster -> ${f.replace('.mp4', 'p.webp')}`);
    } catch { /* poster optionnel */ }
    try { unlinkSync(src); } catch {}
  } catch (e) { console.log('  ERR', f, e.message); }
}
if (vidFiles.length) console.log(`Videos : ${(vIn / 1024).toFixed(0)}KB -> ${(vOut / 1024).toFixed(0)}KB`);

try {
  const remain = readdirSync(SRC_DIR);
  if (remain.length === 0) { rmdirSync(SRC_DIR); console.log('\nDossier raw/ supprimé'); }
} catch {}

console.log('\nTerminé.');
