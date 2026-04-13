import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const SRC = 'frontend/public/verrue-tk';
const OUT = 'frontend/public/verrue-tk';

const QUALITY_MAP = {
  hero: { webp: 78, resize: 800 },
  gallery: { webp: 72, resize: 600 },
  result: { webp: 72, resize: 600 },
  usage: { webp: 72, resize: 700 },
  banner: { webp: 75, resize: 900 },
  avant: { webp: 75, resize: 600 },
  apres: { webp: 75, resize: 600 },
};

function getConfig(name) {
  for (const [key, cfg] of Object.entries(QUALITY_MAP)) {
    if (name.startsWith(key)) return cfg;
  }
  return { webp: 75, resize: 700 };
}

async function run() {
  const files = await readdir(SRC);
  const images = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  console.log(`\nFound ${images.length} images to optimize\n`);

  for (const file of images) {
    const src = join(SRC, file);
    const name = basename(file, extname(file));
    const outWebp = join(OUT, `${name}.webp`);
    const cfg = getConfig(name);

    const info = await stat(src);
    const originalKB = (info.size / 1024).toFixed(1);

    try {
      const img = sharp(src);
      const meta = await img.metadata();

      const maxW = cfg.resize;
      const needsResize = meta.width > maxW;

      let pipeline = sharp(src);
      if (needsResize) {
        pipeline = pipeline.resize(maxW, null, { withoutEnlargement: true });
      }

      await pipeline.webp({ quality: cfg.webp, effort: 6 }).toFile(outWebp);

      const outInfo = await stat(outWebp);
      const newKB = (outInfo.size / 1024).toFixed(1);
      const reduction = ((1 - outInfo.size / info.size) * 100).toFixed(0);

      console.log(`✓ ${file} (${originalKB} KB) → ${name}.webp (${newKB} KB) [-${reduction}%]`);
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  }

  console.log('\nDone!\n');
}

run();
