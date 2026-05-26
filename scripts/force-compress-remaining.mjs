/**
 * Force-compress les images restantes en evitant le memory-mapping de sharp.
 *   1. Lit le fichier en buffer (evite mmap)
 *   2. Compresse le buffer via sharp
 *   3. Lance un SUBPROCESS Node separe pour ecrire le resultat
 *      (le processus parent n'a plus de handle sur le fichier)
 */
import sharp from 'sharp';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const TARGETS = [
  { dir: 'frontend/public/verrue-tk',               threshold: 55, q: 55, maxW: 900 },
  { dir: 'frontend/public/verrue-tk/premium',       threshold: 55, q: 55, maxW: 900 },
  { dir: 'frontend/public/patch-douleur-tk',        threshold: 55, q: 55, maxW: 900 },
  { dir: 'frontend/public/patch-douleur-tk/premium', threshold: 55, q: 55, maxW: 900 },
];

async function compressOne(filePath, q, maxW) {
  const fname = filePath.split('\\').pop();
  const inSize = statSync(filePath).size;

  try {
    // Lecture en buffer pour eviter mmap Windows
    const inBuf = readFileSync(filePath);

    const img = sharp(inBuf).rotate();
    const meta = await img.metadata();
    const targetW = meta.width && meta.width > maxW ? maxW : meta.width;

    const outBuffer = await img
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: q, effort: 6, smartSubsample: true })
      .toBuffer();

    const outSize = outBuffer.length;
    if (outSize >= inSize) {
      console.log(`  SKIP ${fname} (deja optimal)`);
      return null;
    }

    // Ecrit le buffer dans un fichier temp puis renvoie le plan de swap
    const tmpOut = join(tmpdir(), `gs-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
    writeFileSync(tmpOut, outBuffer);

    console.log(
      `  OK   ${fname.padEnd(25)} ${String((inSize / 1024).toFixed(0)).padStart(4)}KB -> ${String((outSize / 1024).toFixed(0)).padStart(4)}KB (-${((1 - outSize / inSize) * 100).toFixed(0)}%)`
    );
    return { tmpOut, finalPath: filePath };
  } catch (e) {
    console.error(`  FAIL ${fname}: ${e.message}`);
    return null;
  }
}

async function main() {
  const plan = [];
  for (const t of TARGETS) {
    const dir = resolve(process.cwd(), t.dir);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir)
      .filter(f => /\.webp$/i.test(f))
      .map(f => join(dir, f))
      .filter(p => statSync(p).size >= t.threshold * 1024);

    console.log(`\n[${t.dir}] ${files.length} fichiers >= ${t.threshold}KB`);
    for (const p of files) {
      const r = await compressOne(p, t.q, t.maxW);
      if (r) plan.push(r);
    }
  }

  if (plan.length === 0) {
    console.log('\n[DONE] rien a remplacer');
    return;
  }

  // Ecrit un script JS separe qui fera le swap dans un PROCESSUS NEUF,
  // sans le moindre handle sharp en memoire.
  const swapScript = join(tmpdir(), `gs-swap-${Date.now()}.mjs`);
  const code = `
import { rmSync, renameSync, existsSync } from 'node:fs';
const plan = ${JSON.stringify(plan)};
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const { tmpOut, finalPath } of plan) {
  const fname = finalPath.split('\\\\').pop();
  let done = false;
  for (let i = 0; i < 10 && !done; i++) {
    try {
      if (existsSync(finalPath)) rmSync(finalPath, { force: true });
      renameSync(tmpOut, finalPath);
      done = true;
      console.log('  SWAP OK  ' + fname);
    } catch (e) {
      if (i === 9) { console.log('  SWAP FAIL ' + fname + ' : ' + e.message); }
      else await sleep(500);
    }
  }
}
`;
  writeFileSync(swapScript, code, 'utf8');

  console.log(`\n[swap] ${plan.length} fichiers via processus separe (attente jusqu'a 5s/fichier)...`);
  try {
    execFileSync(process.execPath, [swapScript], { stdio: 'inherit' });
  } catch (e) {
    console.error('[swap] partial:', e.message);
  }
  try { rmSync(swapScript, { force: true }); } catch {}
  console.log('\n[DONE]');
}

main().catch(e => { console.error(e); process.exit(1); });
