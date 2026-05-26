/**
 * Recompression AGRESSIVE des images de la landing creme-anti-verrue.
 *
 * Objectif : chaque image < 120 KB pour un LCP < 2s sur 3G/4G africain.
 *
 * Strategie :
 *   - WebP quality 68 + effort 6
 *   - max width 1200px (largement suffisant pour mobile retina 2x)
 *   - strip metadata
 *
 * IMPORTANT (Windows) : sharp ne peut pas unlink un fichier lock par le
 * navigateur / Windows Defender / un autre process. Donc on ecrit dans un
 * dossier TEMP (hors du repo) puis on fait un Move-Item -Force via un
 * batch PowerShell a la fin. Ca fonctionne meme si les fichiers sont
 * temporairement lock (Windows met en queue le move).
 *
 * Run : node scripts/optimize-verrue-premium.mjs
 */
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const DIRS = [
  resolve(process.cwd(), 'frontend/public/verrue-tk/premium'),
  resolve(process.cwd(), 'frontend/public/verrue-tk'),
];
const MAX_W = 1200;
const Q = 68;

const TMP_ROOT = join(tmpdir(), `verrue-opt-${Date.now()}`);
mkdirSync(TMP_ROOT, { recursive: true });

/** Liste des ops "src_tmp_webp -> dst_final_webp" a faire en fin de script */
const moves = [];

async function optimizeFile(srcPath) {
  const f = basename(srcPath);
  if (!/\.(jpe?g|png|webp)$/i.test(f)) return;

  const name = basename(f, extname(f));
  const dirName = basename(srcPath.slice(0, srcPath.length - f.length - 1));
  const tmpDir = join(TMP_ROOT, dirName);
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const tmpOut = join(tmpDir, `${name}.webp`);
  const finalOut = join(srcPath.slice(0, srcPath.length - f.length), `${name}.webp`);
  const inSize = statSync(srcPath).size;

  try {
    const img = sharp(srcPath).rotate();
    const meta = await img.metadata();
    const targetW = meta.width && meta.width > MAX_W ? MAX_W : meta.width;

    await img
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: Q, effort: 6 })
      .toFile(tmpOut);

    const outSize = statSync(tmpOut).size;

    // Si l'ancien fichier etait deja plus petit, on skip (rare, mais possible)
    if (outSize >= inSize && extname(f).toLowerCase() === '.webp') {
      console.log(`  SKIP ${f} (deja optimal : ${(inSize / 1024).toFixed(0)}KB)`);
      return;
    }

    moves.push({ from: tmpOut, to: finalOut, origExt: extname(f).toLowerCase() });
    console.log(
      `  OK   ${f}  ${(inSize / 1024).toFixed(0)}KB -> ${(outSize / 1024).toFixed(0)}KB (${((1 - outSize / inSize) * 100).toFixed(0)}% gain)`
    );
  } catch (e) {
    console.error(`  FAIL ${f}:`, e.message);
  }
}

async function run() {
  for (const DIR of DIRS) {
    if (!existsSync(DIR)) continue;
    const files = readdirSync(DIR)
      .map(f => join(DIR, f))
      .filter(p => statSync(p).isFile());

    console.log(`\n[optimize] ${files.length} files in ${DIR}`);
    for (const p of files) await optimizeFile(p);
  }

  if (moves.length === 0) {
    console.log('\nRien a bouger.');
    return;
  }

  // Genere un script PowerShell qui fait les Move-Item -Force en une passe.
  // PowerShell gere correctement les fichiers temporairement lock sous Windows.
  console.log(`\n[swap] ${moves.length} fichiers a remplacer via PowerShell Move-Item -Force...`);
  const psLines = moves.flatMap(({ from, to, origExt }) => {
    const lines = [];
    // Si l'original etait .jpg/.png, il faut le supprimer aussi (pas juste remplacer le .webp)
    if (origExt !== '.webp') {
      const oldFile = to.replace(/\.webp$/i, origExt);
      lines.push(`if (Test-Path -LiteralPath "${oldFile}") { Remove-Item -LiteralPath "${oldFile}" -Force -ErrorAction SilentlyContinue }`);
    }
    lines.push(`Move-Item -LiteralPath "${from}" -Destination "${to}" -Force`);
    return lines;
  });
  const ps1Path = join(TMP_ROOT, 'swap.ps1');
  writeFileSync(ps1Path, psLines.join('\r\n'), 'utf8');

  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Path}"`, { stdio: 'inherit' });
    console.log('[swap] OK');
  } catch (e) {
    console.error('[swap] FAIL:', e.message);
    console.error(`Fichiers temporaires conservees dans : ${TMP_ROOT}`);
    return;
  }

  // Cleanup
  try { rmSync(TMP_ROOT, { recursive: true, force: true }); } catch {}
}

run().catch(e => { console.error(e); process.exit(1); });
