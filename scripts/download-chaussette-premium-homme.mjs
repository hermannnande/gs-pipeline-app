/**
 * Telecharge + compresse en WebP les visuels de la landing "Chaussettes Premium Homme"
 * (slug chaussette-premium-homme, mapping CHAUSSETTE_HOMME_MODLE2).
 *
 * Sortie : frontend/public/chaussette-premium-homme/{hero,m1..mN}.webp
 *
 * Usage : node scripts/download-chaussette-premium-homme.mjs
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'chaussette-premium-homme');
mkdirSync(DST, { recursive: true });

// URLs fournies (doublon 19_35_31 retire). Premier = hero.
const URLS = [
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_35_50.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_43.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_35_31.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_49.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_37.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_30.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_24.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_18.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_08.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_36_00.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_35_44.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_35_36.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_23_37.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_23_25.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_23_09.png',
  'https://obrille.com/wp-content/uploads/2026/05/ChatGPT-Image-30-mai-2026-19_23_01.png',
];

const names = ['hero', ...Array.from({ length: URLS.length - 1 }, (_, i) => `m${i + 1}`)];

async function run(url, name) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const out = join(DST, `${name}.webp`);
  await sharp(buf).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toFile(out);
  return { name, before: buf.length, after: statSync(out).size };
}

console.log(`Telechargement + compression de ${URLS.length} images vers ${DST}\n`);
let ok = 0, fail = 0, total = 0;
const results = await Promise.allSettled(URLS.map((u, i) => run(u, names[i])));
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.status === 'fulfilled') {
    ok++; total += r.value.after;
    console.log(`  OK   ${r.value.name.padEnd(6)} ${(r.value.before / 1024).toFixed(0).padStart(6)}KB -> ${(r.value.after / 1024).toFixed(0).padStart(5)}KB`);
  } else {
    fail++;
    console.log(`  FAIL ${names[i]} : ${r.reason?.message}`);
  }
}
console.log(`\n${ok}/${URLS.length} OK (${(total / 1024 / 1024).toFixed(2)} MB total WebP), ${fail} FAIL`);
