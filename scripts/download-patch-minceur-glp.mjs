/**
 * Medias landing patch-minceur-glp -> frontend/public/patch-minceur-glp/
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DST = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'public', 'patch-minceur-glp');
mkdirSync(DST, { recursive: true });
const B = 'https://obrille.com/wp-content/uploads';
const C = 'https://coachingexpertci.com/wp-content/uploads';

const images = [
  [`${B}/2026/03/1_a3d13ca5-b084-4952-9e08-63a9838558f4_1080x.webp`, 'hero'],
  [`${C}/2026/03/Affiche-Homme-Noir-GLP-1-Patches-462x462.jpg`, 'm1'],
  [`${C}/2026/03/ChatGPT-Image-22-mars-2026-18_12_43-308x462.png`, 'm2'],
  [`${C}/2026/03/ChatGPT-Image-22-mars-2026-19_29_11-462x462.png`, 'm3'],
  [`${B}/2026/03/Affiche-Portrait-GLP-1-Patches.jpg`, 'm4'],
  [`${B}/2026/03/Design-sans-titre-6.jpg`, 'm5'],
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
  dlRaw(`${B}/2026/03/DOULE4-1.mp4`, 'hero', 'mp4'),
  dlRaw(`${B}/2026/03/GI-2.mp4`, 'v2', 'mp4'),
  ...images.map(([u, n]) => dlImage(u, n)),
];
const results = await Promise.allSettled(tasks);
let ok = 0, fail = 0;
for (const r of results) {
  if (r.status === 'fulfilled') { ok++; console.log(`  OK ${r.value.name} ${(r.value.size / 1024).toFixed(0)} KB`); }
  else { fail++; console.log(`  FAIL ${r.reason?.message}`); }
}
console.log(`\n${ok}/${tasks.length} OK`);
process.exit(fail ? 1 : 0);
