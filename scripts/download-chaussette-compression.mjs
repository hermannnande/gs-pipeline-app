/**
 * Telecharge les medias uniques pour chaussette-compression (WP + template API).
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DST = 'frontend/public/chaussette-compression/raw';
mkdirSync(DST, { recursive: true });

const medias = [
  ['https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-pour-soulager-les-douleurs-1.png', 'm1.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/Chaussettes-de-compression-noires-en-detail.png', 'm2.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/Jambe-en-bas-de-compression-noire-1.png', 'm3.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/Jambes-en-bas-avec-des-chaussettes-blanches.png', 'm4.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/Douleur-et-inconfort-sur-fauteuil-beige-1.png', 'm5.png'],
  ['https://obrille.com/wp-content/uploads/2026/04/Femme-attentive-a-ses-pieds-endoloris-1.png', 'm6.png'],
  ['https://obrille.com/wp-content/uploads/2026/03/Photo-de-vente-chaussettes-compression.png', 'm7.png'],
  ['https://obrille.com/wp-content/uploads/2026/03/chaussettes-compression-anti-fatigue-528463.webp', 'm8.webp'],
  ['https://obrille.com/wp-content/uploads/2026/03/Affiche-Mal-au-Pied.png', 'm9.png'],
  ['https://obrille.com/wp-content/uploads/2026/03/Semello_3_1_79187734-31ce-48d1-bdda-8ed8c6ea5480.webp', 'm10.webp'],
  ['https://obrille.com/wp-content/uploads/2026/03/Semello_3_copy_2_146caad9-a4b4-4a3d-aec0-3c4d22f9f262.webp', 'm11.webp'],
  ['https://obrille.com/wp-content/uploads/2026/03/b584c1d286405a5462bcc5e4c8b680db79c20ba72a94164dd2264b91db6d44b2.webp', 'm12.webp'],
  ['https://obrille.com/wp-content/uploads/2026/03/36ffd97733b741858c6ea1be490d8f6b6f958c3ebf1fcc22b80a0a28f56a23e1.webp', 'm13.webp'],
  ['https://obrille.com/wp-content/uploads/2026/03/Ankle-foot-compression-socks-support-sleeve-shop-Australia-online.jpg.webp', 'm14.webp'],
  ['https://obrille.com/wp-content/uploads/2026/05/fait_porter_mes_chaussette_202605091313.jpeg', 'm15.jpeg'],
  ['https://obrille.com/wp-content/uploads/2026/03/fg.mp4', 'v1.mp4'],
];

async function dl(url, name) {
  const out = join(DST, name);
  if (existsSync(out) && statSync(out).size > 5000) {
    return { name, skipped: true, size: statSync(out).size };
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  return { name, size: buf.length };
}

console.log(`Telechargement de ${medias.length} medias...\n`);
const results = await Promise.allSettled(medias.map(([u, n]) => dl(u, n)));
let ok = 0, fail = 0, total = 0;
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const name = medias[i][1];
  if (r.status === 'fulfilled') {
    ok++;
    total += r.value.size;
    console.log(`  ${r.value.skipped ? 'EXIST' : 'OK   '} ${name.padEnd(8)} ${(r.value.size / 1024).toFixed(0).padStart(6)} KB`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} : ${r.reason?.message}`);
  }
}
console.log(`\n${ok}/${medias.length} OK (${(total / 1024 / 1024).toFixed(2)} MB), ${fail} FAIL`);
