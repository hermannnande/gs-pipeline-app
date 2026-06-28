#!/usr/bin/env node
/**
 * Aligne les prix affichés sur les landings avec orderTotal (pack + 1500 F).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'frontend/src/pages/public');
const IMP = "import { orderTotal, packAmount, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';";
const IMP_SHORT = "import { orderTotal, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';";

function ensureImport(content) {
  if (content.includes('orderTotal')) {
    if (!content.includes('packLabel') && content.includes('QTY_OPTS')) {
      content = content.replace(
        /import \{ ([^}]*orderTotal[^}]*)\} from '\.\.\/\.\.\/utils\/pricingHelpers';/,
        (_, inner) => {
          const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
          if (!parts.includes('packLabel')) parts.push('packLabel');
          if (!parts.includes('DELIVERY_FEE_CI')) parts.push('DELIVERY_FEE_CI');
          return `import { ${parts.join(', ')} } from '../../utils/pricingHelpers';`;
        },
      );
    }
    return content;
  }
  const lines = content.split('\n');
  let idx = 0;
  for (let i = 0; i < lines.length; i++) if (lines[i].startsWith('import ')) idx = i;
  lines.splice(idx + 1, 0, content.includes('packLabel') ? IMP_SHORT : IMP);
  return lines.join('\n');
}

function patchFile(path) {
  let c = readFileSync(path, 'utf8');
  if (!c.includes('PRICES') && !c.includes('const PRICE')) return false;
  const before = c;
  c = ensureImport(c);

  // fmt(PRICES[n]) sans orderTotal
  c = c.replace(/fmt\(PRICES\[(\w+)\]\)/g, 'fmt(orderTotal(PRICES, $1))');
  c = c.replace(/fmtNum\(PRICES\[(\w+)\]\)/g, 'fmtNum(orderTotal(PRICES, $1))');
  c = c.replace(/fmtF\(PRICES\[(\w+)\]\)/g, 'fmtF(orderTotal(PRICES, $1))');

  // cartes packs price: PRICES[n]
  c = c.replace(/price: PRICES\[(\d)\]/g, 'price: orderTotal(PRICES, $1)');
  c = c.replace(/p: PRICES\[(\d)\]/g, 'p: orderTotal(PRICES, $1)');

  // QTY_OPTS sub hardcodé -> packLabel
  c = c.replace(
    /(\{ v: (\d),[^}]*?sub: )'[^']*'/g,
    (m, prefix, v) => {
      const sfx = m.includes('FCFA') ? "'FCFA'" : "'F'";
      return `${prefix}packLabel(PRICES, ${v}, ${sfx})`;
    },
  );

  // PACKS chapeau dame
  c = c.replace(
    /price: PRICES\[(\d)\], badge/g,
    'price: orderTotal(PRICES, $1), badge',
  );
  c = c.replace(
    /(\?\.)price ?? PRICES\[1\]/g,
    '?.price ?? orderTotal(PRICES, 1)',
  );
  c = c.replace(
    /PACKS\.find\(\(p\) => p\.v === qty\)\?\.price ?? PRICES\[1\]/g,
    'PACKS.find((p) => p.v === qty)?.price ?? orderTotal(PRICES, 1)',
  );

  // SerumCernePaye popup
  c = c.replace(
    /cashPrice=\{fmt\(PRICES\[qty\] \|\| PRICES\[1\]\)\}/g,
    'cashPrice={fmt(orderTotal(PRICES, qty || 1))}',
  );
  c = c.replace(
    /paystackPrice=\{fmt\(Math\.round\(\(PRICES\[qty\] \|\| PRICES\[1\]\)/g,
    'paystackPrice={fmt(Math.round((orderTotal(PRICES, qty || 1)',
  );

  // orderCfg prices: PRICES -> totals avec livraison
  c = c.replace(/prices: PRICES,/g, 'prices: { 1: orderTotal(PRICES, 1), 2: orderTotal(PRICES, 2), 3: orderTotal(PRICES, 3) },');

  // fmtPack helper lunette — garder cohérent
  c = c.replace(
    /const fmtPack = \(v: number\) => orderTotal\(PRICES, v\)[^;]+;/g,
    '',
  );

  if (c !== before) {
    writeFileSync(path, c);
    return true;
  }
  return false;
}

let n = 0;
for (const file of readdirSync(PUB)) {
  if (!file.endsWith('.tsx')) continue;
  if (patchFile(join(PUB, file))) {
    console.log('patched', file);
    n++;
  }
}

// ChapeauDame modal total
const cd = join(PUB, 'ChapeauDameLanding.tsx');
let c = readFileSync(cd, 'utf8');
if (!c.includes('orderTotal')) {
  c = c.replace(
    /import \{ trackPageView \}/,
    "import { orderTotal, packLabel, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';\nimport { trackPageView }",
  );
}
c = c.replace(
  /const PRICE = PRICES\[1\];/,
  'const PRICE = orderTotal(PRICES, 1);',
);
c = c.replace(
  /price: PRICES\[(\d)\]/g,
  'price: orderTotal(PRICES, $1)',
);
c = c.replace(
  /const total = PACKS\.find\(\(p\) => p\.v === qty\)\?\.price ?? PRICES\[1\];/,
  'const total = orderTotal(PRICES, qty);',
);
writeFileSync(cd, c);
console.log('patched ChapeauDameLanding.tsx');

// Coffret boxer — prix unitaires
for (const file of ['CoffretBoxerLanding.tsx', 'CoffretBoxerLuxeV3Landing.tsx']) {
  const p = join(PUB, file);
  if (!readFileSync(p, 'utf8').match(/UNIT_PRICE|9900/)) continue;
  let x = readFileSync(p, 'utf8');
  if (!x.includes('orderTotal')) {
    x = x.replace(/^(import .+\n)/m, `$1import { orderTotal, DELIVERY_FEE_CI } from '../../utils/pricingHelpers';\n`);
  }
  x = x.replace(/price: UNIT_PRICE/g, 'price: UNIT_PRICE + DELIVERY_FEE_CI');
  x = x.replace(/price: DUO_PRICE/g, 'price: DUO_PRICE + DELIVERY_FEE_CI');
  x = x.replace(/price: 9900/g, 'price: 9900 + DELIVERY_FEE_CI');
  x = x.replace(/price: 19800/g, 'price: 19800 + DELIVERY_FEE_CI');
  x = x.replace(/\$\{fmt\(UNIT_PRICE\)\}/g, '${fmt(UNIT_PRICE + DELIVERY_FEE_CI)}');
  x = x.replace(/\$\{fmt\(DUO_PRICE\)\}/g, '${fmt(DUO_PRICE + DELIVERY_FEE_CI)}');
  writeFileSync(p, x);
  console.log('patched', file);
}

console.log(`done (${n} landing files)`);
