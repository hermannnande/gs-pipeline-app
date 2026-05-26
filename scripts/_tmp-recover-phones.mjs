/**
 * Recuperation des 164 telephones tronques (225XXXXXXX 10 chars) via
 * cross-reference du nom complet dans d'autres commandes.
 *
 * Critere de FIABILITE strict :
 *   1. Le tronque a un telephone "225XXXXXXX" (= apres "225" il reste 7 chiffres
 *      qui sont les 7 premiers du vrai numero CIV "0XXXXXXX???")
 *   2. On cherche d'autres commandes ou le telephone valide commence par
 *      "0" + ces 7 chiffres = "0XXXXXXX" (les 8 premiers chiffres correspondent)
 *   3. ET le nom du candidat contient le nom complet du tronque (insensitive,
 *      ignore espaces multiples, accents). OU vice-versa.
 *   4. Les noms doivent faire au moins 5 caracteres pour eviter faux positifs
 *      sur prenoms communs (ex: "Daouda", "Kouakou").
 *
 * Mode DRY-RUN par defaut. --apply pour valider en DB.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // enleve accents
    .replace(/[^a-z0-9]+/g, ' ')        // espaces uniques
    .trim();
}

function isReliableMatch(truncatedName, candidateName) {
  const a = normalizeName(truncatedName);
  const b = normalizeName(candidateName);
  if (a.length < 5 || b.length < 5) return false;

  // Match si l'un contient l'autre (substring)
  if (a.includes(b) || b.includes(a)) return true;

  // Match si tous les mots de l'un sont dans l'autre (au moins 2 mots communs)
  const wa = a.split(' ').filter((w) => w.length >= 3);
  const wb = b.split(' ').filter((w) => w.length >= 3);
  if (wa.length < 1 || wb.length < 1) return false;

  const common = wa.filter((w) => wb.includes(w));
  if (common.length >= 2) return true;
  if (common.length === 1 && wa.length === 1 && wb.length === 1) return true;

  return false;
}

console.log(`\n=== ${APPLY ? '⚠️  APPLY MODE' : '🟢 DRY-RUN MODE'} ===\n`);

// 1. Toutes les commandes tronquees
const truncated = await prisma.order.findMany({
  where: { clientTelephone: { startsWith: '225' } },
  select: {
    id: true, clientNom: true, clientTelephone: true, clientVille: true,
    produitNom: true, status: true, createdAt: true,
  },
});

const truncated10 = truncated.filter((o) => {
  const d = (o.clientTelephone || '').replace(/\D/g, '');
  return d.length === 10 && d.startsWith('225');
});

console.log(`Tronquees a recuperer : ${truncated10.length}\n`);

const reliable = [];
const suspect = [];
let scanned = 0;

for (const o of truncated10) {
  const after225 = o.clientTelephone.slice(3); // ex: "0505112"
  const target8 = '0' + after225.slice(0, 7);  // "0" + "0505112" = "00505112" mais on veut le vrai 8 prefix...
  // En fait : 225 enleve, il reste 7 chiffres. Ces 7 chiffres SONT les 7 premiers
  // du vrai numero qui commence par "0". Donc le vrai numero commence par
  // "0" + les 6 premiers de "after225"  = "0" + after225.substring(0, 6) ? NON
  // Wait : si client tape +225 0505112345, on garde 225 + 0505112 = 2250505112.
  // Les 7 chiffres "0505112" = 0,5,0,5,1,1,2 = les 7 PREMIERS chiffres apres le 225.
  // Le vrai numero etait 0505112345. Donc les 7 premiers du vrai = "0505112".
  // Donc on cherche un telephone qui commence par "0505112" (7 chars).
  const search7 = after225.slice(0, 7); // "0505112"

  const candidates = await prisma.order.findMany({
    where: {
      AND: [
        { id: { not: o.id } },
        { clientTelephone: { startsWith: search7 } },
      ],
    },
    select: { id: true, clientNom: true, clientTelephone: true, clientVille: true, status: true },
    take: 10,
  });

  // Filtrer pour ne garder que les telephones valides (10 chars commencant par 0)
  const validCandidates = candidates.filter((c) => {
    const d = (c.clientTelephone || '').replace(/\D/g, '');
    return d.length === 10 && d.startsWith('0');
  });

  if (validCandidates.length > 0) {
    // Trouver le meilleur match
    const reliableCandidate = validCandidates.find((c) => isReliableMatch(o.clientNom, c.clientNom));
    if (reliableCandidate) {
      reliable.push({ truncated: o, candidate: reliableCandidate });
    } else {
      suspect.push({ truncated: o, candidate: validCandidates[0] });
    }
  }
  scanned++;
  if (scanned % 30 === 0) process.stdout.write(`  scan: ${scanned}/${truncated10.length}\r`);
}

console.log(`\n\n=== RESULTATS ===\n`);
console.log(`✅ Matches FIABLES (nom complet correspond)  : ${reliable.length}`);
console.log(`⚠️  Matches SUSPECTS (meme tel mais nom diff) : ${suspect.length}`);
console.log(`❌ Pas de match du tout                      : ${truncated10.length - reliable.length - suspect.length}\n`);

if (reliable.length > 0) {
  console.log('=== ✅ FIABLES (a appliquer en confiance) ===');
  reliable.forEach((r) => {
    console.log(`  #${r.truncated.id} | ${r.truncated.clientTelephone.padEnd(13)} -> ${r.candidate.clientTelephone.padEnd(13)} | ${r.truncated.clientNom?.slice(0, 28).padEnd(28)} | match=#${r.candidate.id} (${r.candidate.clientNom?.slice(0, 28)})`);
  });
}

if (suspect.length > 0 && !APPLY) {
  console.log('\n=== ⚠️ SUSPECTS (NE seront PAS appliques - juste pour info) ===');
  suspect.slice(0, 15).forEach((r) => {
    console.log(`  #${r.truncated.id} | ${r.truncated.clientTelephone.padEnd(13)} -> ${r.candidate.clientTelephone.padEnd(13)} | ${r.truncated.clientNom?.slice(0, 28).padEnd(28)} | candidat=#${r.candidate.id} (${r.candidate.clientNom?.slice(0, 28)})`);
  });
  if (suspect.length > 15) console.log(`  ... et ${suspect.length - 15} autres suspects`);
}

if (!APPLY) {
  console.log(`\n💡 Pour appliquer UNIQUEMENT les ${reliable.length} fiables, relancer avec :`);
  console.log(`   node scripts/_tmp-recover-phones.mjs --apply`);
  await prisma.$disconnect();
  process.exit(0);
}

console.log('\n=== APPLICATION DES MODIFS EN DB (FIABLES uniquement) ===\n');
let success = 0;
for (const r of reliable) {
  try {
    await prisma.order.update({
      where: { id: r.truncated.id },
      data: { clientTelephone: r.candidate.clientTelephone },
    });
    success++;
  } catch (e) {
    console.error(`  [KO] #${r.truncated.id} : ${e.message}`);
  }
}

console.log(`\n✅ ${success} telephones recuperes`);
console.log(`(${suspect.length} suspects ignores pour eviter de mettre un mauvais numero a une mauvaise personne)`);

await prisma.$disconnect();
