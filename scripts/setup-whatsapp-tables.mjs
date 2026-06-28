/**
 * Crée les tables WhatsApp (config + file d'attente) sur la base Supabase prod.
 * Additif et idempotent : CREATE TABLE IF NOT EXISTS — ne touche aucune table existante.
 * Seed la ligne de config avec la clé WaSender (passée par env, jamais committée).
 *
 * Usage (PowerShell) :
 *   $env:SUPABASE_DIRECT_URL="postgresql://...supabase.co:5432/postgres?sslmode=require"
 *   $env:WASENDER_API_KEY="<clé>"
 *   node scripts/setup-whatsapp-tables.mjs
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.SUPABASE_DIRECT_URL;
if (!url) { console.error('SUPABASE_DIRECT_URL manquant'); process.exit(1); }
const apiKey = process.env.WASENDER_API_KEY || null;
const senderNumber = process.env.WASENDER_SENDER || null;

const prisma = new PrismaClient({ datasources: { db: { url } } });

const DDL = [
  `CREATE TABLE IF NOT EXISTS whatsapp_config (
     id SERIAL PRIMARY KEY,
     api_key TEXT,
     sender_number TEXT,
     enabled BOOLEAN NOT NULL DEFAULT true,
     template TEXT,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE TABLE IF NOT EXISTS whatsapp_outbox (
     id SERIAL PRIMARY KEY,
     to_number TEXT NOT NULL,
     text TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'PENDING',
     attempts INTEGER NOT NULL DEFAULT 0,
     last_error TEXT,
     msg_id TEXT,
     order_id INTEGER,
     created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     sent_at TIMESTAMP(3)
   )`,
  `CREATE INDEX IF NOT EXISTS whatsapp_outbox_status_created_idx ON whatsapp_outbox (status, created_at)`,
];

try {
  for (const sql of DDL) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('Tables whatsapp_config + whatsapp_outbox prêtes.');

  const rows = await prisma.$queryRawUnsafe('SELECT id, enabled, (api_key IS NOT NULL) AS has_key, sender_number FROM whatsapp_config ORDER BY id LIMIT 1');
  if (!rows.length) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO whatsapp_config (api_key, sender_number, enabled) VALUES ($1, $2, true)',
      apiKey, senderNumber,
    );
    console.log(`Config créée (clé ${apiKey ? 'définie' : 'absente'}).`);
  } else {
    // Met à jour la clé seulement si fournie
    if (apiKey) {
      await prisma.$executeRawUnsafe(
        'UPDATE whatsapp_config SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        apiKey, rows[0].id,
      );
      console.log(`Config existante (id=${rows[0].id}) : clé mise à jour.`);
    } else {
      console.log(`Config existante (id=${rows[0].id}) : has_key=${rows[0].has_key}, enabled=${rows[0].enabled}`);
    }
  }
} catch (e) {
  console.error('ERREUR :', e?.message || e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
