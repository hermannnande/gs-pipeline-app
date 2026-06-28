/**
 * Telecharge + compresse les medias de la landing chaussette chauffante (slug chaussette).
 * Sortie : frontend/public/chaussette/{hero.mp4, hero.webp, m1..m8, ba*.webp}
 *
 * Usage : node scripts/download-chaussette-chauffante.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'chaussette');
mkdirSync(DST, { recursive: true });

const BASE = 'https://obrille.com/wp-content/uploads';

const images = [
  [`${BASE}/2025/12/uify-462x462.jpg`, 'hero', 'webp'],
  [`${BASE}/2025/12/jh-scaled.jpg`, 'm1', 'webp'],
  [`${BASE}/2025/12/Affiche-Tourmaline-1x1-1.png`, 'm2', 'webp'],
  [`${BASE}/2025/12/ituytr-scaled.jpg`, 'm3', 'webp'],
  [`${BASE}/2025/12/gytfgf-scaled.jpg`, 'm4', 'webp'],
  [`${BASE}/2025/12/iyut-309x462.jpg`, 'm5', 'webp'],
  [`${BASE}/2025/12/greeef.jpg`, 'ba1-before', 'webp'],
  [`${BASE}/2025/12/fzihuqgyu.jpg`, 'ba1-after', 'webp'],
  [`${BASE}/2025/12/zdyh.jpg`, 'ba2-before', 'webp'],
  [`${BASE}/2025/12/ig.jpg`, 'ba2-after', 'webp'],
  [`${BASE}/2025/12/oioa.jpg`, 'ba3-before', 'webp'],
  [`${BASE}/2025/12/KDKDI.jpg`, 'ba3-after', 'webp'],
];

const video = [`${BASE}/2025/12/H-2.mp4`, 'hero', 'mp4'];

async function dlImage(url, name, mode) {
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
  const optimized = await sharp(buf)
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  writeFileSync(out, optimized);
  return { name, size: optimized.length };
}

async function dlVideo(url, name) {
  const out = join(DST, `${name}.mp4`);
  if (existsSync(out) && statSync(out).size > 100000) {
    return { name, skipped: true, size: statSync(out).size };
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

console.log(`Telechargement medias chaussette -> ${DST}\n`);

const [videoRes, ...imageRes] = await Promise.all([
  dlVideo(video[0], video[1]).then((r) => ({ status: 'fulfilled', value: r })).catch((e) => ({ status: 'rejected', reason: e })),
  ...images.map(([u, n, m]) => dlImage(u, n, m).then((r) => ({ status: 'fulfilled', value: r })).catch((e) => ({ status: 'rejected', reason: e }))),
]);

let ok = 0;
let fail = 0;
for (const [i, r] of [videoRes, ...imageRes].entries()) {
  const name = i === 0 ? 'hero.mp4' : images[i - 1][1];
  if (r.status === 'fulfilled') {
    ok++;
    const tag = r.value.skipped ? 'EXIST' : 'OK   ';
    console.log(`  ${tag} ${name.padEnd(12)} ${(r.value.size / 1024).toFixed(0).padStart(6)} KB`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} : ${r.reason?.message}`);
  }
}
console.log(`\n${ok}/${images.length + 1} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
