#!/usr/bin/env node
/**
 * Compression one-shot des medias hero/section lourds des landings DEDIEES
 * (servis en direct depuis le VPS, pas via wsrv.nl).
 *
 *  - Videos .mp4  -> re-encode H.264 CRF 28, cap 1080px, faststart, sans audio
 *  - Images .png  -> conversion WebP qualite 82 (les refs code sont MAJ a part)
 *
 * Les originaux sont sauvegardes dans  media-originals-backup/  a la racine
 * AVANT tout ecrasement (ces fichiers ne sont pas suivis par git).
 *
 * Usage : node scripts/_tmp-compress-media.mjs [--videos] [--images] [--dry]
 *         (sans flag = videos + images)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, statSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'frontend', 'public');
const BACKUP = join(ROOT, 'media-originals-backup');

// sharp est installe dans frontend/node_modules -> resolution explicite.
const requireFromFrontend = createRequire(join(ROOT, 'frontend', 'package.json'));
const sharp = requireFromFrontend('sharp');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ONLY_V = args.includes('--videos');
const ONLY_I = args.includes('--images');
const doVideos = ONLY_V || !ONLY_I;
const doImages = ONLY_I || !ONLY_V;

const kb = (n) => `${(n / 1024).toFixed(0)} Ko`;
const pct = (a, b) => `${(100 - (b / a) * 100).toFixed(0)} %`;

function backup(absPath) {
  const rel = relative(PUBLIC, absPath);
  const dest = join(BACKUP, rel);
  if (!existsSync(dest)) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(absPath, dest);
  }
}

// ── Dossiers reellement deployes sur le VPS (cf. deploy-vps.mjs candidates) ─
const DEPLOYED_DIRS = [
  'verrue-tk', 'creme-anti-verrue', 'spray-douleur', 'spray-lipome', 'lipome',
  'serum-yeux', 'creme-minceur', 'creme-minceur-fb', 'patch-douleur-tk',
  'poudre-pousse-cheveux', 'chaussettes-homme', 'chaussette-premium-homme',
  'chaussette-compression', 'chaussette-compression-v2', 'chaussette',
  'detoxminceur', 'bande-sport-minceur', 'patch-minceur-glp', 'lunette-de-nuit',
  'creme-anti-cerne', 'coffret-boxer-homme', 'coffret-boxer-luxe-v3',
  'chapeau-dame', 'spray-vitiligo', 'creme-verrue-tk-v2', 'ongle-incarne-v2',
];

// Seuils : on ne touche que ce qui pese (compression rentable).
const VIDEO_MIN = 350 * 1024;

// Liste tous les fichiers d'un dossier deploye, recursif, hors _raw.
function walk(absDir, out = []) {
  if (!existsSync(absDir)) return out;
  for (const e of readdirSync(absDir, { withFileTypes: true })) {
    if (e.name === '_raw' || e.name.startsWith('_raw')) continue;
    const p = join(absDir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Auto-decouverte : tous les .mp4 deployes >= seuil, PAS deja compresses
// (un fichier deja traite possede une copie dans media-originals-backup/).
function discoverVideos() {
  const list = [];
  for (const d of DEPLOYED_DIRS) {
    for (const abs of walk(join(PUBLIC, d))) {
      if (!/\.mp4$/i.test(abs)) continue;
      if (statSync(abs).size < VIDEO_MIN) continue;
      const rel = relative(PUBLIC, abs).split('\\').join('/');
      const alreadyDone = existsSync(join(BACKUP, relative(PUBLIC, abs)));
      if (!alreadyDone) list.push(rel);
    }
  }
  return list.sort();
}

const VIDEOS = discoverVideos();

// ── Images PNG/JPG lourdes deployees (deja toutes converties, garde-fou) ───
const IMAGES = [];

function compressVideo(rel) {
  const src = join(PUBLIC, rel);
  if (!existsSync(src)) { console.log(`  skip (absent) : ${rel}`); return [0, 0]; }
  const before = statSync(src).size;
  const tmp = src + '.tmp.mp4';
  if (DRY) { console.log(`  (dry) ${rel}  ${kb(before)}`); return [before, before]; }

  const r = spawnSync('ffmpeg', [
    '-y', '-i', src,
    '-vf', "scale='min(1080,iw)':-2",
    '-c:v', 'libx264', '-crf', '28', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-an',
    tmp,
  ], { stdio: 'pipe' });

  if (r.status !== 0 || !existsSync(tmp)) {
    console.log(`  ECHEC ffmpeg : ${rel}\n${r.stderr?.toString().split('\n').slice(-4).join('\n')}`);
    if (existsSync(tmp)) rmSync(tmp);
    return [before, before];
  }
  const after = statSync(tmp).size;
  if (after >= before) {
    console.log(`  garde original (compression inutile) : ${rel}  ${kb(before)} -> ${kb(after)}`);
    rmSync(tmp);
    return [before, before];
  }
  backup(src);
  rmSync(src);
  renameSync(tmp, src);
  console.log(`  OK ${rel}  ${kb(before)} -> ${kb(after)}  (-${pct(before, after)})`);
  return [before, after];
}

async function compressImage(rel) {
  const src = join(PUBLIC, rel);
  if (!existsSync(src)) { console.log(`  skip (absent) : ${rel}`); return [0, 0]; }
  const before = statSync(src).size;
  const dest = src.replace(/\.png$/i, '.webp');
  if (DRY) { console.log(`  (dry) ${rel} -> .webp  ${kb(before)}`); return [before, before]; }

  await sharp(src).webp({ quality: 82 }).toFile(dest);
  const after = statSync(dest).size;
  backup(src);
  rmSync(src);
  console.log(`  OK ${rel} -> ${rel.replace(/\.png$/i, '.webp')}  ${kb(before)} -> ${kb(after)}  (-${pct(before, after)})`);
  return [before, after];
}

const main = async () => {
  let tB = 0, tA = 0;
  if (doVideos) {
    console.log(`\n=== VIDEOS (ffmpeg H.264 CRF28, cap 1080, faststart, sans audio) ===`);
    for (const v of VIDEOS) { const [b, a] = compressVideo(v); tB += b; tA += a; }
  }
  if (doImages) {
    console.log(`\n=== IMAGES (PNG -> WebP q82) ===`);
    for (const i of IMAGES) { const [b, a] = await compressImage(i); tB += b; tA += a; }
  }
  console.log(`\n=== TOTAL : ${kb(tB)} -> ${kb(tA)}  (-${tB ? pct(tB, tA) : '0 %'})`);
  console.log(`Originaux sauvegardes dans : ${relative(ROOT, BACKUP)}/`);
};

main().catch((e) => { console.error(e); process.exit(1); });
