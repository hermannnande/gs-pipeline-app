#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'frontend/src/pages/public');

function repair(content) {
  let c = content;
  const before = c;

  c = c.replace(/animationDelay: '\.2s` \}\}/g, "animationDelay: '.2s' }}");
  c = c.replace(/animationDelay: '\.1s` \}\}/g, "animationDelay: '.1s' }}");
  c = c.replace(/animationDelay: `\.25s' \}\}/g, "animationDelay: '.25s' }}");
  c = c.replace(/animationDelay: '2s` \}\}/g, "animationDelay: '2s' }}");

  // JSX texte : ${fmtTotal -> {fmtTotal
  c = c.replace(/\$\{fmtTotal\(/g, '{fmtTotal(');

  // Attributs template literal : remettre ${fmtTotal dans les backticks
  c = c.replace(/=\{`([^`]*)`\}/g, (m, inner) => {
    if (!inner.includes('{fmtTotal(')) return m;
    const fixed = inner.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}');
    return `={\`${fixed}\`}`;
  });
  c = c.replace(/document\.title = `([^`]*)`/g, (m, inner) => {
    if (!inner.includes('{fmtTotal(')) return m;
    const fixed = inner.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}');
    return `document.title = \`${fixed}\``;
  });
  c = c.replace(/(a: `)([^`]*)(`)/g, (m, pre, inner, suf) => {
    if (!inner.includes('{fmtTotal(')) return m;
    return pre + inner.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}') + suf;
  });
  c = c.replace(/(rose:\s+`)([^`]*)(`)/g, (m, pre, inner, suf) => {
    if (!inner.includes('{fmtTotal(')) return m;
    return pre + inner.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}') + suf;
  });
  c = c.replace(/(phrase=`)([^`]*)(`)/g, (m, pre, inner, suf) => {
    if (!inner.includes('{fmtTotal(')) return m;
    return 'phrase={' + '`' + inner.replace(/\{fmtTotal\((\d)\)\}/g, '${fmtTotal($1)}') + '`' + '}';
  });

  // highlight array template items
  c = c.replace(/`\{fmtTotal\((\d)\)/g, '`${fmtTotal($1)');

  // Marquees cassés — normaliser items avec backticks mélangés
  c = c.replace(/items=\{\['([^']*)`,/g, "items={['$1',");
  c = c.replace(/`, `([^`]+)`, `([^']+)',\s*'/g, '`, `$1`, `$2`, \'');
  c = c.replace(/`, `([^`]+)`, `([^']+)',\s*'/g, '`, `$1`, `$2`, \'');

  // Poudre l'offre
  c = c.replace(/l`offre/g, "l'offre");

  // ChapeauDame fiche cassée
  c = c.replace(
    /text: 'Disponible en plusieurs couleurs pour s\\'accorder à votre style\.`, cta: `Commander à \$\{fmtTotal\(1\)\} FR`, ctaTone: `red', gradTitle: 'rose'/,
    "text: 'Disponible en plusieurs couleurs pour s\\'accorder à votre style.', cta: `Commander à ${fmtTotal(1)} FR`, ctaTone: 'red', gradTitle: 'rose'",
  );

  // FAQ chapeau dame pack 2/3
  c = c.replace(
    /2 chapeaux : 15 900 FR · 3 chapeaux : 21 000 FR/,
    '2 chapeaux : ${fmtTotal(2)} FR · 3 chapeaux : ${fmtTotal(3)} FR',
  );

  // VerrueTk FAQ pack 3
  c = c.replace(/3 boites a 24 900 F/, '3 boites a ${fmtTotal(3)} F');

  // Marquees pack 2/3 restants
  const pairs = [
    ['2 bandes 12 000 Fr', '2 bandes ${fmtTotal(2)} Fr'],
    ['3 bandes 15 000 Fr', '3 bandes ${fmtTotal(3)} Fr'],
    ['2 boîtes 12 000 Fr', '2 boîtes ${fmtTotal(2)} Fr'],
    ['3 boîtes 15 000 Fr', '3 boîtes ${fmtTotal(3)} Fr'],
    ['10 paires à 16 900 Fr', '10 paires à ${fmtTotal(2)} Fr'],
    ['15 paires à 24 900 Fr', '15 paires à ${fmtTotal(3)} Fr'],
    ['10 paires 16 900 Fr', '10 paires ${fmtTotal(2)} Fr'],
    ['15 paires 24 900 Fr', '15 paires ${fmtTotal(3)} Fr'],
    ['10 paires 16 900 F', '10 paires ${fmtTotal(2)} F'],
    ['15 paires 24 900 F', '15 paires ${fmtTotal(3)} F'],
    ['Pack 2 pots 16 900 F', 'Pack 2 pots ${fmtTotal(2)} F'],
    ['Pack 3 pots 24 900 F', 'Pack 3 pots ${fmtTotal(3)} F'],
    ['2 paquets 12 900 Fr', '2 paquets ${fmtTotal(2)} Fr'],
    ['3 paquets 16 000 Fr', '3 paquets ${fmtTotal(3)} Fr'],
  ];
  for (const [from, to] of pairs) {
    c = c.replaceAll(`'${from}'`, `\`${to}\``);
    c = c.replaceAll(`'${from},`, `\`${to}\`,`);
  }

  // Marquees avec quotes finales cassées
  c = c.replace(/Paiement à la livraison`\]\}/g, 'Paiement à la livraison`]}');
  c = c.replace(/Perdez du poids rapidement`\]\}/g, 'Perdez du poids rapidement`]}');
  c = c.replace(/Livraison rapide`\]\}/g, 'Livraison rapide`]}');

  return c !== before ? c : null;
}

let n = 0;
for (const file of readdirSync(PUB)) {
  if (!file.endsWith('.tsx')) continue;
  const path = join(PUB, file);
  const next = repair(readFileSync(path, 'utf8'));
  if (next) {
    writeFileSync(path, next);
    console.log('repaired', file);
    n++;
  }
}
console.log(`done (${n})`);
