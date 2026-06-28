/**
 * Remet PRICES / PRICES_BASE à { 1: 9900, 2: 16900, 3: 24900 } dans tout le frontend.
 * Usage : node scripts/reset-all-landing-prices.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'frontend/src');
const STANDARD = '{ 1: 9900, 2: 16900, 3: 24900 }';
/** soindemoi.net/anti-age — offre SMS 6 500 / 12 000 / 15 000 */
const SKIP_FILES = new Set([
  'SerumCerneSmsLanding.tsx',
  'SerumCerneSmsThankYou.tsx',
]);

const PRICE_LINE = /^(const PRICES(?:_BASE)?: Record<number, number> = )\{ 1: \d+, 2: \d+, 3: \d+ \}(;?)$/gm;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(SRC)) {
  if (SKIP_FILES.has(file.split(/[/\\]/).pop() || '')) {
    console.log('— ignoré (anti-age SMS):', file.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
    continue;
  }
  let text = readFileSync(file, 'utf8');
  const next = text.replace(PRICE_LINE, `$1${STANDARD}$2`);
  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed++;
    console.log('✓', file.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
  }
}

// Coffrets boxer (structure différente)
const boxerFixes = [
  [join(SRC, 'pages/public/CoffretBoxerLanding.tsx'), [
    ['const PACK = 7000;', 'const PACK = 9900;'],
    ['const DUO = 12900;', 'const DUO = 16900;'],
    ['const DUO = 19800;', 'const DUO = 16900;'],
  ]],
  [join(SRC, 'pages/public/CoffretBoxerLuxeV3Landing.tsx'), [
    ['const UNIT_PRICE = 7000;', 'const UNIT_PRICE = 9900;'],
    ['const DUO_PRICE = 12900;', 'const DUO_PRICE = 16900;'],
    ['const DUO_PRICE = UNIT_PRICE * 2;', 'const DUO_PRICE = 16900;'],
  ]],
  [join(SRC, 'pages/public/CoffretBoxerLuxeV3ThankYou.tsx'), [
    ['const FALLBACK_PRICES: Record<string, number> = { noir: 7000, pro: 7000, both: 14000 };',
      'const FALLBACK_PRICES: Record<string, number> = { noir: 9900, pro: 9900, both: 16900 };'],
  ]],
];

for (const [file, reps] of boxerFixes) {
  let text = readFileSync(file, 'utf8');
  let touched = false;
  for (const [from, to] of reps) {
    if (text.includes(from)) {
      text = text.replace(from, to);
      touched = true;
    }
  }
  if (touched) {
    writeFileSync(file, text, 'utf8');
    changed++;
    console.log('✓', file.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
  }
}

console.log(`\n${changed} fichier(s) mis à jour.`);

// Boutique catalogue — prix hero pack 1
const boutiquePath = join(SRC, 'pages/public/BoutiqueLanding.tsx');
let boutique = readFileSync(boutiquePath, 'utf8');
const boutiqueNext = boutique.replace(/price: '\d[\d ]* F'/g, "price: '9 900 F'");
if (boutiqueNext !== boutique) {
  writeFileSync(boutiquePath, boutiqueNext, 'utf8');
  console.log('✓ pages/public/BoutiqueLanding.tsx → 9 900 F');
}
