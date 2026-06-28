/**
 * Télécharge + compresse les médias landing bouilloire-intelligente.
 * Sortie : frontend/public/bouilloire-intelligente/
 *
 * Usage : node scripts/download-bouilloire-intelligente.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DST = join(__dirname, '..', 'frontend', 'public', 'bouilloire-intelligente');
mkdirSync(DST, { recursive: true });

const requireFromFrontend = createRequire(join(__dirname, '..', 'frontend', 'package.json'));
const sharp = requireFromFrontend('sharp');

const BASE = 'https://obrille.com/wp-content/uploads/2026/06';

const images = [
  [`${BASE}/ChatGPT-Image-26-juin-2026-17_52_46.png`, 'hero'],
  [`${BASE}/Woman_using_kettle_in_kitchen_202606261753.jpeg`, 'm1'],
  [`${BASE}/ChatGPT-Image-26-juin-2026-17_52_56.png`, 'm2'],
  [`${BASE}/ChatGPT-Image-26-juin-2026-17_53_01.png`, 'm3'],
];

const videos = [
  [`${BASE}/Testing_smart_electric_kettle_202606261757.mp4`, 'v1'],
  [`${BASE}/Fait_autre_video_pub_bouton_202606261756.mp4`, 'v2'],
  [`${BASE}/Video_ad_selling_smart_kettle_202606261756-1.mp4`, 'v3'],
  [`${BASE}/Video_ad_selling_smart_kettle_202606261756.mp4`, 'v4'],
];

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

async function dlImage(url, name) {
  const out = join(DST, `${name}.webp`);
  if (existsSync(out) && statSync(out).size > 4000) return { name, skipped: true, size: statSync(out).size };
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const optimized = await sharp(buf).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  writeFileSync(out, optimized);
  return { name, size: optimized.length };
}

async function dlVideo(url, name) {
  const raw = join(DST, `${name}.raw.mp4`);
  const out = join(DST, `${name}.mp4`);
  if (existsSync(out) && statSync(out).size > 80000) return { name, skipped: true, size: statSync(out).size };

  if (!existsSync(raw) || statSync(raw).size < 80000) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  }

  if (hasFfmpeg) {
    const r = spawnSync('ffmpeg', [
      '-y', '-i', raw,
      '-c:v', 'libx264', '-crf', '28', '-preset', 'fast',
      '-vf', 'scale=\'min(720,iw)\':-2',
      '-an', '-movflags', '+faststart',
      out,
    ], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`ffmpeg failed for ${name}`);
  } else {
    writeFileSync(out, readFileSync(raw));
  }
  return { name, size: statSync(out).size };
}

console.log(`Medias bouilloire -> ${DST}\nffmpeg: ${hasFfmpeg ? 'oui' : 'non (copie brute)'}\n`);

for (const [url, name] of images) {
  try {
    const r = await dlImage(url, name);
    console.log(r.skipped ? `  skip ${name}.webp` : `  ok   ${name}.webp (${Math.round(r.size / 1024)} Ko)`);
  } catch (e) {
    console.error(`  FAIL ${name}:`, e.message);
  }
}

for (const [url, name] of videos) {
  try {
    const r = await dlVideo(url, name);
    console.log(r.skipped ? `  skip ${name}.mp4` : `  ok   ${name}.mp4 (${Math.round(r.size / 1024)} Ko)`);
  } catch (e) {
    console.error(`  FAIL ${name}:`, e.message);
  }
}

console.log('\nTermine.');
