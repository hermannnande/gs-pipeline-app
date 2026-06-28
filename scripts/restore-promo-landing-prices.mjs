/**
 * Restaure les prix promo par landing (état d'avant le reset 9900/16900/24900).
 * Usage : node scripts/restore-promo-landing-prices.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PUB = join(ROOT, 'frontend/src/pages/public');

/** slug/fichier → packs 1/2/3 (F, hors livraison — DELIVERY_FEE_CI = 0). */
const BY_FILE = {
  'CremeOngleIncarneV2Landing.tsx': { 1: 7000, 2: 12900, 3: 14900 },
  'CremeVerrueTkLanding.tsx': { 1: 7000, 2: 12900, 3: 14900 },
  'CremeVerrueTk2Landing.tsx': { 1: 7000, 2: 12900, 3: 14900 },
  'CremeAntiVerrueLanding.tsx': { 1: 7000, 2: 12900, 3: 14900 },
  'VerrueTkLanding.tsx': { 1: 7000, 2: 12900, 3: 14900 },
  'ChaussetteChauffanteLanding.tsx': { 1: 5000, 2: 9000, 3: 12000 },
  'DetoxMinceurLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'CremeAntiCerneLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'PatchDouleurLandingPremium.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'SerumCerneLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'BandeSportMinceurLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'PatchMinceurGlpLanding.tsx': { 1: 7000, 2: 12900, 3: 16000 },
  'ChapeauDameLanding.tsx': { 1: 8000, 2: 15900, 3: 21000 },
  'ChaussetteCompressionV2Landing.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'ChaussetteCompressionLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'CremeAntiLipomeLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'CremeAntiLipomeTkLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'SprayDouleurTkLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'SprayLipomeLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'SprayLipomeTkLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'CremeMinceurFbLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'ChapeauGavrocheLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'PoudrePousseCheveuxLanding.tsx': { 1: 7000, 2: 12000, 3: 15000 },
  'LunetteDeNuitLanding.tsx': { 1: 8500, 2: 11000, 3: 14000 },
  // Palier « premium » déjà en place avant le reset global
  'ChaussetteHommeLanding.tsx': { 1: 9900, 2: 16900, 3: 24900 },
  'ChaussettePremiumLanding.tsx': { 1: 9900, 2: 16900, 3: 24900 },
  'SerumCerneTkLanding.tsx': { 1: 9900, 2: 16900, 3: 24900 },
  'SerumCernePayeLanding.tsx': { 1: 9900, 2: 16900, 3: 24900 },
  'SprayVitiligoLanding.tsx': { 1: 9900, 2: 16900, 3: 24900 },
};

const PRICE_LINE = /^(const PRICES(?:_BASE)?: Record<number, number> = )\{ 1: \d+, 2: \d+, 3: \d+ \}(;?)$/m;

function fmtPrices(p) {
  return `{ 1: ${p[1]}, 2: ${p[2]}, 3: ${p[3]} }`;
}

function fmtNum(n) {
  return n.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');
}

let changed = 0;

for (const [file, prices] of Object.entries(BY_FILE)) {
  const path = join(PUB, file);
  let text = readFileSync(path, 'utf8');
  const next = text.replace(PRICE_LINE, `$1${fmtPrices(prices)}$2`);
  if (next !== text) {
    writeFileSync(path, next, 'utf8');
    console.log('✓', file, fmtPrices(prices));
    changed++;
  }
}

// Coffrets boxer
const boxerPath = join(PUB, 'CoffretBoxerLanding.tsx');
let boxer = readFileSync(boxerPath, 'utf8');
const boxerBefore = boxer;
boxer = boxer.replace(/const PACK = \d+;/, 'const PACK = 7000;');
boxer = boxer.replace(/const DUO = \d+;/, 'const DUO = 12900;');
if (boxer !== boxerBefore) {
  writeFileSync(boxerPath, boxer, 'utf8');
  console.log('✓ CoffretBoxerLanding.tsx PACK=7000 DUO=12900');
  changed++;
}

const luxePath = join(PUB, 'CoffretBoxerLuxeV3Landing.tsx');
let luxe = readFileSync(luxePath, 'utf8');
const luxeBefore = luxe;
luxe = luxe.replace(/const UNIT_PRICE = \d+;/, 'const UNIT_PRICE = 7000;');
luxe = luxe.replace(/const DUO_PRICE = \d+;/, 'const DUO_PRICE = 12900;');
if (luxe !== luxeBefore) {
  writeFileSync(luxePath, luxe, 'utf8');
  console.log('✓ CoffretBoxerLuxeV3Landing.tsx UNIT=7000 DUO=12900');
  changed++;
}

// Boutique — prix hero (pack 1)
const boutiquePath = join(PUB, 'BoutiqueLanding.tsx');
const BOUTIQUE_PRICES = {
  'coffret-boxer-homme': 7000,
  'creme-anti-cerne': 7000,
  'creme-anti-lipome': 7000,
  'chaussette-homme': 9900,
  patchdouleurtk: 7000,
  spraydouleurtk: 7000,
  'creme-anti-verrue': 7000,
  'creme-verrue-tk': 7000,
  spraylipome: 7000,
  'serum-cerne': 7000,
  'poudre-pousse-cheveux': 7000,
  'chaussette-compression': 7000,
  'creme-ongle-incarne': 7000,
  crememinceurfb: 7000,
};
let boutique = readFileSync(boutiquePath, 'utf8');
let boutiqueChanged = false;
for (const [slug, p1] of Object.entries(BOUTIQUE_PRICES)) {
  const re = new RegExp(`(slug: '${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?price: ')[^']+(')`, 'm');
  const rep = `$1${fmtNum(p1)} F$2`;
  const n = boutique.replace(re, rep);
  if (n !== boutique) {
    boutique = n;
    boutiqueChanged = true;
  }
}
if (boutiqueChanged) {
  writeFileSync(boutiquePath, boutique, 'utf8');
  console.log('✓ BoutiqueLanding.tsx prix catalogue');
  changed++;
}

console.log(`\n${changed} fichier(s) mis à jour.`);
