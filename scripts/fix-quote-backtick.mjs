import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'frontend/src');
let n = 0;

function fix(c) {
  // single-quote open, backtick close (corruption from bad script)
  c = c.replace(/'([^'\n$`]*?)`\)/g, "'$1')");
  c = c.replace(/'([^'\n$`]*?)`;/g, "'$1';");
  c = c.replace(/'([^'\n$`]*?)`,/g, "'$1',");
  c = c.replace(/'([^'\n$`]*?)`}/g, "'$1'}");
  c = c.replace(/'([^'\n$`]*?)`\]/g, "'$1']");
  c = c.replace(/'([^'\n$`]*?)`\s*$/gm, "'$1'");
  // split string broken: .split(' `)
  c = c.replace(/\.split\(' `\)/g, ".split(' ')");
  c = c.replace(/setEndDate\('`\)/g, "setEndDate('')");
  c = c.replace(/setNote\('`\)/g, "setNote('')");
  c = c.replace(/: '`\)/g, ": '')");
  c = c.replace(/: '`\}/g, ": ''}");
  c = c.replace(/'fr-FR`\)/g, "'fr-FR')");
  c = c.replace(/'fr-FR`\}/g, "'fr-FR'}");
  c = c.replace(/'helvetica', 'bold`\)/g, "'helvetica', 'bold')");
  c = c.replace(/'Config JSON invalide`\)/g, "'Config JSON invalide')");
  c = c.replace(/'Erreur`\)/g, "'Erreur')");
  c = c.replace(/'http`\)/g, "'http')");
  c = c.replace(/'PRIVATE`\)/g, "'PRIVATE')");
  c = c.replace(/'GROUP`\)/g, "'GROUP')");
  c = c.replace(/'BROADCAST`\)/g, "'BROADCAST')");
  c = c.replace(/'commandes`\)/g, "'commandes')");
  c = c.replace(/'valides`\)/g, "'valides')");
  c = c.replace(/'livres`\)/g, "'livres')");
  c = c.replace(/'expedies`\)/g, "'expedies')");
  c = c.replace(/'conversion`\)/g, "'conversion')");
  c = c.replace(/'appelants`\)/g, "'appelants')");
  c = c.replace(/'devices`\)/g, "'devices')");
  c = c.replace(/'logs`\)/g, "'logs')");
  c = c.replace(/'today`\)/g, "'today')");
  c = c.replace(/'week`\)/g, "'week')");
  c = c.replace(/'month`\)/g, "'month')");
  c = c.replace(/'all`\)/g, "'all')");
  c = c.replace(/'\/chat`\)/g, "'/chat')");
  c = c.replace(/'\/admin\/orders`\)/g, "'/admin/orders')");
  return c;
}

for (const f of globSync('**/*.{tsx,ts}', { cwd: root })) {
  const p = join(root, f);
  let c = readFileSync(p, 'utf8');
  const b = c;
  c = fix(c);
  if (c !== b) {
    writeFileSync(p, c);
    console.log(f);
    n++;
  }
}
console.log('done', n);
