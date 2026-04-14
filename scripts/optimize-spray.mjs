import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const SRC = 'frontend/public/spray-douleur';

async function run() {
  const files = await readdir(SRC);
  const images = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  console.log(`\nFound ${images.length} images to optimize\n`);

  for (const file of images) {
    const src = join(SRC, file);
    const name = basename(file, extname(file));
    const outWebp = join(SRC, `${name}.webp`);
    const info = await stat(src);
    const originalKB = (info.size / 1024).toFixed(1);
    try {
      const meta = await sharp(src).metadata();
      const maxW = name === 'hero' || name === 'banner' ? 900 : 700;
      let pipeline = sharp(src);
      if (meta.width > maxW) pipeline = pipeline.resize(maxW, null, { withoutEnlargement: true });
      await pipeline.webp({ quality: 76, effort: 6 }).toFile(outWebp);
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
