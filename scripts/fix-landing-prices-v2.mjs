#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'frontend/src/pages/public');

function patch(content, file) {
  let c = content;
  const orig = c;

  // Modals / submit : cfg.prices = pack seul ; orderTotal() ajoute la livraison
  c = c.replace(
    /prices: \{ 1: orderTotal\(PRICES, 1\), 2: orderTotal\(PRICES, 2\), 3: orderTotal\(PRICES, 3\) \}/g,
    'prices: PRICES',
  );

  c = c.replace(/\bfmt\(PRICES\[o\.v\]\)/g, 'fmt(orderTotal(PRICES, o.v))');
  c = c.replace(/(\{ v: (\d)[^}]*?\bp: )\d+/g, '$1orderTotal(PRICES, $2)');
  c = c.replace(/\bprice: orderTotal\(PRICES, (\d)\), oldPrice/g, 'price: orderTotal(PRICES, $1), oldPrice');

  if (file === 'LunetteDeNuitLanding.tsx') {
    c = c.replace(
      /const QTY_OPTS = \[\n([\s\S]*?)\n\];/,
      `const QTY_OPTS = [
  { v: 1, label: '1 paire', sub: packLabel(PRICES, 1, 'F'), save: '' },
  { v: 2, label: '2 paires', sub: packLabel(PRICES, 2, 'F'), tag: 'Le + choisi', save: 'Économisez 1 000 F' },
  { v: 3, label: '3 paires', sub: packLabel(PRICES, 3, 'F'), tag: 'Meilleure offre', save: 'Économisez 4 000 F' },
];`,
    );
    c = c.replace(/value: PRICES\[o\.v\]/g, 'value: orderTotal(PRICES, o.v)');
  }

  if (file === 'ChapeauDameLanding.tsx') {
    c = c.replace(
      /const PACKS = \[[\s\S]*?\];/,
      `const PACKS = [
  { v: 1, label: '1 chapeau', sub: 'L\\'essentiel', price: orderTotal(PRICES, 1), badge: null as string | null },
  { v: 2, label: '2 chapeaux', sub: 'Le plus choisi', price: orderTotal(PRICES, 2), badge: 'Recommandé' },
  { v: 3, label: '3 chapeaux', sub: 'Meilleure offre', price: orderTotal(PRICES, 3), badge: 'Top affaire' },
];`,
    );
    c = c.replace(
      /const total = PACKS\.find\(\(p\) => p\.v === qty\)\?\.price ?? PRICES\[1\];/,
      'const total = orderTotal(PRICES, qty);',
    );
  }

  if (file === 'CoffretBoxerLanding.tsx') {
    if (!c.includes('DELIVERY_FEE_CI')) {
      c = c.replace(
        /import \{ trackPageView \}/,
        "import { DELIVERY_FEE_CI } from '../../utils/pricingHelpers';\nimport { trackPageView }",
      );
    }
    c = c.replace(
      /const PRODUCTS: Record<ProductKey, \{ label: string; price: number; sub: string \}> = \{[\s\S]*?\};/,
      `const fmtP = (n: number) => n.toLocaleString('fr-FR').replace(/\\u202f|,/g, ' ');
const PACK = 9900;
const DUO = 19800;
const PRODUCTS: Record<ProductKey, { label: string; price: number; sub: string }> = {
  tommy: { label: \`Coffret de 3 boxers Tommy Hilfiger - \${fmtP(PACK + DELIVERY_FEE_CI)} F\`, price: PACK + DELIVERY_FEE_CI, sub: '3 boxers Tommy Hilfiger' },
  luxe: { label: \`Coffret de 3 boxers Louis Vuitton - \${fmtP(PACK + DELIVERY_FEE_CI)} F\`, price: PACK + DELIVERY_FEE_CI, sub: '3 boxers Louis Vuitton' },
  both: { label: \`Les deux coffrets (6 boxers) - \${fmtP(DUO + DELIVERY_FEE_CI)} F\`, price: DUO + DELIVERY_FEE_CI, sub: '6 boxers (Tommy + Louis Vuitton)' },
};`,
    );
    c = c.replace(/'🎁 Coffret 3 boxers à 9 900 F'/g, "'🎁 Coffret 3 boxers à 11 400 F'");
  }

  if (file === 'CoffretBoxerLuxeV3Landing.tsx') {
    if (!c.includes('DELIVERY_FEE_CI')) {
      c = c.replace(
        /import \{ trackPageView \}/,
        "import { DELIVERY_FEE_CI } from '../../utils/pricingHelpers';\nimport { trackPageView }",
      );
    }
  }

  return c !== orig ? c : null;
}

for (const file of readdirSync(PUB)) {
  if (!file.endsWith('.tsx')) continue;
  const path = join(PUB, file);
  const next = patch(readFileSync(path, 'utf8'), file);
  if (next) {
    writeFileSync(path, next);
    console.log('fixed', file);
  }
}

console.log('done');
