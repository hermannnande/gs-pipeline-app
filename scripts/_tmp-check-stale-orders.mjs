import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

console.log('\n=== AUDIT COMMANDES "A APPELER" oubliees ===\n');

const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Total dans la liste "A appeler" actuelle
const totalActive = await prisma.order.count({
  where: { status: { in: ['NOUVELLE', 'A_APPELER'] } },
});
console.log(`Total NOUVELLE + A_APPELER : ${totalActive}`);

// Avec RDV programme (exclus de la liste)
const withRdv = await prisma.order.count({
  where: {
    status: { in: ['NOUVELLE', 'A_APPELER'] },
    rdvProgramme: true,
  },
});
console.log(`Avec RDV programme (caches) : ${withRdv}`);

// Sans RDV (= visibles)
const visibles = await prisma.order.count({
  where: {
    status: { in: ['NOUVELLE', 'A_APPELER'] },
    rdvProgramme: false,
  },
});
console.log(`Visibles dans liste 'A appeler' : ${visibles}\n`);

// Distribution par age
console.log('=== Distribution par age (visibles seulement) ===\n');
const orders = await prisma.order.findMany({
  where: {
    status: { in: ['NOUVELLE', 'A_APPELER'] },
    rdvProgramme: false,
  },
  select: {
    id: true, clientNom: true, clientTelephone: true, status: true,
    createdAt: true, nombreAppels: true, calledAt: true,
  },
  orderBy: { createdAt: 'asc' },
});

const buckets = {
  'a) > 30 jours': 0,
  'b) > 7 jours': 0,
  'c) > 48h': 0,
  'd) > 24h': 0,
  'e) < 24h (recent)': 0,
};

const oldest = [];
for (const o of orders) {
  const ageMs = Date.now() - new Date(o.createdAt).getTime();
  const ageHours = ageMs / 3600000;
  if (ageHours > 30 * 24) buckets['a) > 30 jours']++;
  else if (ageHours > 7 * 24) buckets['b) > 7 jours']++;
  else if (ageHours > 48) buckets['c) > 48h']++;
  else if (ageHours > 24) buckets['d) > 24h']++;
  else buckets['e) < 24h (recent)']++;

  if (ageHours > 48) oldest.push(o);
}

Object.entries(buckets).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(25)} ${v}`);
});

console.log(`\n=== Top 25 plus vieilles (> 48h, sans RDV) ===`);
oldest.slice(0, 25).forEach((o) => {
  const ageDays = Math.round((Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const lastCall = o.calledAt ? `appel il y a ${Math.round((Date.now() - new Date(o.calledAt).getTime()) / (1000 * 60 * 60 * 24))}j` : 'jamais appele';
  console.log(`  #${o.id} | ${ageDays}j | ${o.status.padEnd(11)} | appels=${o.nombreAppels} | ${lastCall.padEnd(20)} | ${o.clientNom?.slice(0, 25).padEnd(25)} | ${o.clientTelephone}`);
});

await prisma.$disconnect();
