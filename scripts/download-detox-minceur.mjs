/**
 * Telecharge les medias landing detoxminceur -> frontend/public/detoxminceur/
 * Usage : node scripts/download-detox-minceur.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'detoxminceur');
mkdirSync(DST, { recursive: true });

const images = [
  ['https://coachingexpertci.com/wp-content/uploads/2025/11/Affiche-Detox-Vibrante_1-308x462.jpg', 'hero'],
  ['https://coachingexpertci.com/wp-content/uploads/2025/11/chgv-308x462.jpg', 'm1'],
  ['https://coachingexpertci.com/wp-content/uploads/2025/11/kugyb-308x462.jpg', 'm2'],
  ['https://obrille.com/wp-content/uploads/2025/11/grdf.jpg', 'ba1-before'],
  ['https://obrille.com/wp-content/uploads/2025/11/ytgd.jpg', 'ba1-after'],
  ['https://obrille.com/wp-content/uploads/2025/11/trdcgfh.jpg', 'ba2-before'],
  ['https://obrille.com/wp-content/uploads/2025/11/oiutyfr.jpg', 'ba2-after'],
  ['https://obrille.com/wp-content/uploads/2025/11/htgfd.jpg', 'ba3-before'],
  ['https://obrille.com/wp-content/uploads/2025/11/tf.jpg', 'ba3-after'],
];

async function dlImage(url, name) {
  const out = join(DST, `${name}.webp`);
  if (existsSync(out) && statSync(out).size > 5000) return { name, skipped: true, size: statSync(out).size };
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const optimized = await sharp(buf).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  writeFileSync(out, optimized);
  return { name, size: optimized.length };
}

async function dlRaw(url, name, ext) {
  const out = join(DST, `${name}.${ext}`);
  if (existsSync(out) && statSync(out).size > 10000) return { name, skipped: true, size: statSync(out).size };
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

console.log(`Telechargement medias detoxminceur -> ${DST}\n`);
const tasks = [
  dlRaw('https://obrille.com/wp-content/uploads/2025/11/det-3.mp4', 'hero', 'mp4'),
  dlRaw('https://coachingexpertci.com/wp-content/uploads/2026/03/8f8f158a06774404964a2cacbbbb3da3_Detox_GIF_7-462x462.gif', 'gif1', 'gif'),
  ...images.map(([u, n]) => dlImage(u, n)),
];
const results = await Promise.allSettled(tasks);
let ok = 0, fail = 0;
for (const r of results) {
  if (r.status === 'fulfilled') { ok++; console.log(`  OK   ${r.value.name} ${(r.value.size / 1024).toFixed(0)} KB`); }
  else { fail++; console.log(`  FAIL ${r.reason?.message}`); }
}
console.log(`\n${ok}/${tasks.length} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
