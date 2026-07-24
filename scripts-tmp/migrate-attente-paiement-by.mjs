/**
 * Migration additive : colonne orders.attentePaiementById (+ FK vers users).
 * Enregistre quel employé a marqué une commande "en attente de paiement".
 * Idempotent : ne fait rien si la colonne/contrainte existe déjà.
 *
 * Usage : SUPABASE_DB_URL="postgresql://..." node scripts-tmp/migrate-attente-paiement-by.mjs
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error('SUPABASE_DB_URL manquant'); process.exit(1); }

const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  const col = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='attentePaiementById'`
  );
  if (col.length === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN "attentePaiementById" INTEGER`);
    console.log('Colonne attentePaiementById ajoutée.');
  } else {
    console.log('Colonne déjà présente — rien à faire.');
  }

  const fk = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM pg_constraint WHERE conname='orders_attentePaiementById_fkey'`
  );
  if (fk.length === 0) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE orders ADD CONSTRAINT "orders_attentePaiementById_fkey" FOREIGN KEY ("attentePaiementById") REFERENCES users(id) ON DELETE SET NULL`
    );
    console.log('Contrainte FK ajoutée.');
  } else {
    console.log('Contrainte FK déjà présente — rien à faire.');
  }

  const check = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders' AND column_name='attentePaiementById'`
  );
  console.log('Vérification :', JSON.stringify(check));
} finally {
  await prisma.$disconnect();
}
