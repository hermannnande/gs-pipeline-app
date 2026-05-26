/**
 * Download parallele des 12 medias pour serum-cerne.
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DST = 'frontend/public/serum-cerne/raw';
mkdirSync(DST, { recursive: true });

const medias = [
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_29_54.png', 'img-1.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_30_00.png', 'img-2.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_29_48.png', 'img-3.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_29_42.png', 'img-4.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT_Image_23_202604231328.jpeg', 'img-5.jpeg'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT_Image_23_202604231329.jpeg', 'img-6.jpeg'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT_Image_23_202604231328-1.jpeg', 'img-7.jpeg'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_08_09.png', 'img-8.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-23-avr.-2026-13_30_05.png', 'img-9.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/fqutsghx-1.mp4', 'video-1.mp4'],
  ['https://obrille.com/wp-content/uploads/2026/04/fqutsghx-2.mp4', 'video-2.mp4'],
  ['https://obrille.com/wp-content/uploads/2026/04/fqutsghx-3.mp4', 'video-3.mp4'],
];

async function dl(url, name) {
  const out = join(DST, name);
  if (existsSync(out) && statSync(out).size > 10000) {
    return { name, skipped: true, size: statSync(out).size };
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

console.log(`Telechargement parallele de ${medias.length} medias...\n`);
const results = await Promise.allSettled(medias.map(([u, n]) => dl(u, n)));

let totalOk = 0, totalSize = 0, totalFail = 0;
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const name = medias[i][1];
  if (r.status === 'fulfilled') {
    const v = r.value;
    totalOk++;
    totalSize += v.size;
    console.log(`  ${v.skipped ? 'EXIST' : 'OK   '} ${name.padEnd(14)} ${(v.size / 1024).toFixed(0).padStart(5)} KB`);
  } else {
    totalFail++;
    console.log(`  FAIL  ${name} : ${r.reason?.message || r.reason}`);
  }
}
console.log(`\nTotal : ${totalOk}/${medias.length} OK (${(totalSize / 1024 / 1024).toFixed(2)} MB), ${totalFail} FAIL`);
