/**
 * Compresse toutes les images du tunnel Spray Vitiligo en WebP.
 * Sortie : frontend/public/spray-vitiligo/*.webp
 *
 * Utilisation : node scripts/compress-spray-vitiligo.mjs
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'frontend', 'public', 'spray-vitiligo');

const WP = (n) => `https://obrille.com/wp-content/uploads/2026/05/${n}`;

// Mapping nom_local -> URL WordPress source + largeur cible
const IMAGES = [
  { name: 'hero',    src: WP('ChatGPT-Image-24-mai-2026-15_15_38.png'),         width: 1200, quality: 82 },
  { name: 'm01',     src: WP('ChatGPT-Image-21-mai-2026-22_03_19-1.png'),       width: 1024, quality: 80 },
  { name: 'm02',     src: WP('ChatGPT-Image-21-mai-2026-22_03_28-1.png'),       width: 1024, quality: 80 },
  { name: 'm03',     src: WP('ChatGPT-Image-24-mai-2026-14_40_03.png'),         width: 1024, quality: 80 },
  { name: 'm04',     src: WP('ChatGPT-Image-24-mai-2026-14_40_13.png'),         width: 1024, quality: 80 },
  { name: 'realCC',  src: WP('Vitiligo_LicenceCC3.jpg'),                        width: 800,  quality: 82 },
  { name: 'expert',  src: WP('ChatGPT-Image-31-mars-2026-12_14_16-1-1.png'),    width: 1024, quality: 80 },
  { name: 'affiche', src: WP('Affiche-Spray-Vitiligo-2-1.png'),                 width: 1024, quality: 82 },
  { name: 'm08',     src: WP('ChatGPT-Image-21-mai-2026-22_03_33-1.png'),       width: 1024, quality: 80 },
  { name: 'm09',     src: WP('ChatGPT-Image-24-mai-2026-14_39_46.png'),         width: 1024, quality: 80 },
  { name: 'm10',     src: WP('ChatGPT-Image-24-mai-2026-14_39_54.png'),         width: 1024, quality: 80 },
  { name: 'm11',     src: WP('ChatGPT-Image-24-mai-2026-14_40_20.png'),         width: 1024, quality: 80 },
];

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`✓ Dossier créé : ${OUT_DIR}`);
  }

  let totalIn = 0;
  let totalOut = 0;

  for (const img of IMAGES) {
    const outPath = join(OUT_DIR, `${img.name}.webp`);
    process.stdout.write(`→ ${img.name.padEnd(10)} `);

    const buf = await fetchBuffer(img.src);
    totalIn += buf.length;

    const webp = await sharp(buf)
      .resize({ width: img.width, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: img.quality, effort: 6 })
      .toBuffer();

    await writeFile(outPath, webp);
    totalOut += webp.length;

    const inKB = (buf.length / 1024).toFixed(0);
    const outKB = (webp.length / 1024).toFixed(0);
    const ratio = ((1 - webp.length / buf.length) * 100).toFixed(0);
    console.log(`${inKB} KB → ${outKB} KB  (-${ratio}%)`);
  }

  console.log('');
  console.log(`Total : ${(totalIn / 1024 / 1024).toFixed(2)} MB → ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Gain  : -${((1 - totalOut / totalIn) * 100).toFixed(0)}% (${((totalIn - totalOut) / 1024 / 1024).toFixed(2)} MB économisés)`);
}

main().catch((e) => {
  console.error('✗ Erreur :', e);
  process.exit(1);
});
