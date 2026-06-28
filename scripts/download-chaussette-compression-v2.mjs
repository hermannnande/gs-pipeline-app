/**
 * Telecharge + compresse en WebP les 11 medias uniques (+ 1 GIF) de la
 * landing Chaussette de Compression V2 (slug chaussette-compression-v2,
 * mapping CHAUSSETTE_DE_COMPRESSION).
 *
 * Sortie : frontend/public/chaussette-compression-v2/{hero,m1..m10,gif1}.webp
 *
 * Usage : node scripts/download-chaussette-compression-v2.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'chaussette-compression-v2');
mkdirSync(DST, { recursive: true });

// 12 URLs fournies par l'utilisateur, 1 doublon retire (11_20_10.png en double).
// Mapping URL -> nom de fichier de sortie. L'ordre determine le role dans la page.
const medias = [
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_21_30.png', 'hero',  'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_26-1.png', 'm1', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_10.png',   'm2', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/GIF1-Anti-fatigue-compression-fo_480x480.webp', 'gif1', 'pass'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_37.png',   'm3', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_21.png',   'm4', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_16.png',   'm5', 'webp'],
  // 11_20_10 (doublon) ignore
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_20_04.png',   'm6', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_19_59.png',   'm7', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_19_52.png',   'm8', 'webp'],
  ['https://obrille.com/wp-content/uploads/2026/06/ChatGPT-Image-3-juin-2026-11_02_40.png',   'm9', 'webp'],
];

async function dl(url, name, mode) {
  const out = join(DST, `${name}.webp`);
  if (existsSync(out) && statSync(out).size > 5000) {
    return { name, skipped: true, size: statSync(out).size };
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  if (mode === 'pass') {
    // GIF animee deja en .webp anime : ecrire tel quel.
    writeFileSync(out, buf);
    return { name, size: buf.length, pass: true };
  }

  // PNG -> WebP, resize 1000px width, quality 75.
  const optimized = await sharp(buf)
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  writeFileSync(out, optimized);
  return { name, size: optimized.length };
}

console.log(`Telechargement + compression de ${medias.length} medias -> ${DST}\n`);
const results = await Promise.allSettled(medias.map(([u, n, m]) => dl(u, n, m)));
let ok = 0, fail = 0, total = 0;
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const name = medias[i][1];
  if (r.status === 'fulfilled') {
    ok++;
    total += r.value.size;
    const tag = r.value.skipped ? 'EXIST' : (r.value.pass ? 'PASS ' : 'OK   ');
    console.log(`  ${tag} ${name.padEnd(6)} ${(r.value.size / 1024).toFixed(0).padStart(6)} KB`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} : ${r.reason?.message}`);
  }
}
console.log(`\n${ok}/${medias.length} OK (${(total / 1024 / 1024).toFixed(2)} MB), ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
