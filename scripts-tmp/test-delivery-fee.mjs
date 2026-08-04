// Test ponctuel forfait livraison +1 500 F (POST /api/public/order en local).
// Crée 2 commandes test (oxymètre -> doit inclure +1500 ; ajusteur -> non),
// vérifie montant + note en DB, puis les supprime proprement (FK cascade).
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const env = Object.fromEntries(readFileSync('.env.vercel.prod', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["'\r]$/g, '')]; }));
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const BASE = 'http://localhost:5099/api';

const post = async (productId) => {
  const res = await fetch(`${BASE}/public/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, customerName: 'TEST FORFAIT LIVRAISON', customerPhone: '0700000099', customerCity: 'Abidjan', quantity: 1 }),
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(`POST ${productId} a echoue (${res.status}): ${JSON.stringify(body)}`);
  return body.order?.id ?? body.id ?? body.orderId;
};

const idOxy = await post(144);   // OXYMETRE_POULS (forfait attendu)
const idAdjust = await post(142); // AJUSTEUR_CEINTURE (pas de forfait)
console.log('Commandes test creees :', idOxy, idAdjust);

const [oxy, adj] = await Promise.all([
  prisma.order.findUnique({ where: { id: idOxy }, select: { montant: true, noteLivreur: true, produitNom: true } }),
  prisma.order.findUnique({ where: { id: idAdjust }, select: { montant: true, noteLivreur: true, produitNom: true } }),
]);

console.log('\n--- RESULTATS ---');
console.log(`OXYMETRE_POULS  : montant=${oxy?.montant} (attendu 10000 = 8500+1500) | note=${oxy?.noteLivreur ? 'OK présente' : 'ABSENTE !!'}`);
console.log(`AJUSTEUR_CEINT. : montant=${adj?.montant} (attendu 6900, pas de forfait) | note=${adj?.noteLivreur ?? 'null (correct)'}`);

const okOxy = oxy?.montant === 10000 && (oxy?.noteLivreur || '').includes('Livraison +1 500 F incluse');
const okAdj = adj?.montant === 6900 && !adj?.noteLivreur;
console.log(`\nTEST OXYMETRE : ${okOxy ? 'OK ✅' : 'ÉCHEC ❌'} · TEST AJUSTEUR : ${okAdj ? 'OK ✅' : 'ÉCHEC ❌'}`);

// Nettoyage : suppression des 2 commandes test (status_history en cascade).
await prisma.statusHistory.deleteMany({ where: { orderId: { in: [idOxy, idAdjust] } } });
const del = await prisma.order.deleteMany({ where: { id: { in: [idOxy, idAdjust] } } });
console.log(`Nettoyage : ${del.count} commande(s) test supprimée(s).`);

await prisma.$disconnect();
process.exit(okOxy && okAdj ? 0 : 1);
