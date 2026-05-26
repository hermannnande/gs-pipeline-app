/**
 * Compresse + optimise toutes les images de la landing patch-douleur-tk.
 *
 *   - Nouvelles images Man_with_back (.jpeg ~600KB) -> .webp ~80-120KB
 *   - Images existantes deja compressees : reduction legere si possible
 *
 * Meme strategie Windows-safe que pour verrue-tk :
 *   - On ecrit les fichiers optimises dans TEMP (hors du repo)
 *   - Puis on swappe via PowerShell Move-Item -Force (gere les locks).
 */
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, mkdirSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const DIRS = [
  resolve(process.cwd(), 'frontend/public/patch-douleur-tk/premium'),
  resolve(process.cwd(), 'frontend/public/patch-douleur-tk'),
];
const MAX_W = 1200;
const Q = 70;

const TMP_ROOT = join(tmpdir(), `patch-opt-${Date.now()}`);
mkdirSync(TMP_ROOT, { recursive: true });

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
    const origExt = extname(f).toLowerCase();

    if (outSize >= inSize && origExt === '.webp') {
      console.log(`  SKIP ${f} (deja optimal : ${(inSize / 1024).toFixed(0)}KB)`);
      return;
    }

    moves.push({ from: tmpOut, to: finalOut, origExt, origPath: srcPath });
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

  console.log(`\n[swap] ${moves.length} fichiers a remplacer via PowerShell...`);
  const psLines = moves.flatMap(({ from, to, origExt, origPath }) => {
    const lines = [];
    if (origExt !== '.webp') {
      lines.push(`if (Test-Path -LiteralPath "${origPath}") { Remove-Item -LiteralPath "${origPath}" -Force -ErrorAction SilentlyContinue }`);
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
    console.error('[swap] partial FAIL:', e.message);
  }

  try { rmSync(TMP_ROOT, { recursive: true, force: true }); } catch {}
}

run().catch(e => { console.error(e); process.exit(1); });
