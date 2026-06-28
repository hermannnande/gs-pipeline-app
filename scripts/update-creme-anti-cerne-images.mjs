/**
 * Remplace m2, m5, m7, m9, m10, m14 sur la landing creme-anti-cerne.
 * Conserve les autres medias depuis le site live si absents en local.
 * Usage : node scripts/update-creme-anti-cerne-images.mjs
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DST = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'public', 'creme-anti-cerne');
const LIVE = 'https://coachingexpertci.com/creme-anti-cerne';
mkdirSync(DST, { recursive: true });

const B = 'https://obrille.com/wp-content/uploads/2026/06';
const REPLACE = [
  [`${B}/ChatGPT-Image-19-juin-2026-12_44_58.png`, 'm2'],
  [`${B}/ChatGPT-Image-19-juin-2026-12_45_05.png`, 'm5'],
  [`${B}/ChatGPT-Image-19-juin-2026-12_44_53.png`, 'm7'],
  [`${B}/ChatGPT-Image-19-juin-2026-12_44_48.png`, 'm9'],
  [`${B}/ChatGPT-Image-19-juin-2026-12_44_43.png`, 'm10'],
  [`${B}/ChatGPT-Image-19-juin-2026-12_51_25.png`, 'm14'],
];
const KEEP = ['m1', 'm3', 'm4', 'm6', 'm8', 'm11', 'm12', 'm13'];

async function saveWebp(buf, name) {
  const out = await sharp(buf)
    .resize({ width: 700, withoutEnlargement: true })
    .webp({ quality: 65, effort: 6 })
    .toBuffer();
  writeFileSync(join(DST, `${name}.webp`), out);
  return out.length;
}

console.log(`Dossier : ${DST}\n`);

for (const name of KEEP) {
  const outPath = join(DST, `${name}.webp`);
  if (existsSync(outPath) && statSync(outPath).size > 5000) {
    console.log(`  SKIP ${name}.webp (deja present)`);
    continue;
  }
  const res = await fetch(`${LIVE}/${name}.webp`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Backup ${name}: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, raw);
  console.log(`  BACKUP ${name}.webp  ${(raw.length / 1024).toFixed(0)} KB`);
}

console.log('');
for (const [url, name] of REPLACE) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const size = await saveWebp(raw, name);
  console.log(`  NEW ${name}.webp  ${(raw.length / 1024).toFixed(0)} KB -> ${(size / 1024).toFixed(0)} KB`);
}

console.log('\nTermine.');
