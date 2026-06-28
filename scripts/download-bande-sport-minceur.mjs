/**
 * Medias landing bande-sport-minceur -> frontend/public/bande-sport-minceur/
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DST = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'public', 'bande-sport-minceur');
mkdirSync(DST, { recursive: true });
const B = 'https://obrille.com/wp-content/uploads';

const images = [
  [`${B}/2026/03/ChatGPT-Image-26-mars-2026-09_19_42-308x462.png`, 'hero'],
  [`${B}/2026/03/ChatGPT-Image-16-mars-2026-22_24_47-308x462.png`, 'm1'],
  [`${B}/2026/03/screenshot_2026-01-05_16-22-39-479x462.png`, 'm2'],
  [`${B}/2026/03/7_f749a112-90f1-435e-b0e3-b9fe05184890-1-1-462x462.png`, 'm3'],
  [`${B}/2026/03/3_77086cfc-7b4d-4847-832a-34b2e1742d7a-1-462x462.png`, 'm4'],
  [`${B}/2026/03/2_77f5adeb-89fe-4e8c-8861-34d163a24a86-1-462x462.png`, 'm5'],
];

async function dlImage(url, name) {
  const out = join(DST, `${name}.webp`);
  if (existsSync(out) && statSync(out).size > 5000) return { name, size: statSync(out).size };
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

async function dlRaw(url, name, ext) {
  const out = join(DST, `${name}.${ext}`);
  if (existsSync(out) && statSync(out).size > 50000) return { name, size: statSync(out).size };
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

console.log(`Download -> ${DST}\n`);
const tasks = [
  dlRaw(`${B}/2026/03/CHA3-2.mp4`, 'hero', 'mp4'),
  dlRaw(`${B}/2026/03/sfdgf-2.mp4`, 'v2', 'mp4'),
  ...images.map(([u, n]) => dlImage(u, n)),
];
const results = await Promise.allSettled(tasks);
let ok = 0, fail = 0;
for (const r of results) {
  if (r.status === 'fulfilled') { ok++; console.log(`  OK ${(r.value.name)} ${(r.value.size/1024).toFixed(0)} KB`); }
  else { fail++; console.log(`  FAIL ${r.reason?.message}`); }
}
console.log(`\n${ok}/${tasks.length} OK`);
process.exit(fail ? 1 : 0);
