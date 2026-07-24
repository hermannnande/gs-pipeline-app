/**
 * Backfill : renseigne orders.attentePaiementById pour les commandes déjà
 * "en attente de paiement" mais sans auteur enregistré (le handler ne posait
 * pas ce champ avant le correctif).
 *
 * Source d'attribution (par ordre de priorité) :
 *   1. La ligne status_history "Marquée \"En attente de paiement\"" la plus récente
 *      (changedBy = qui a réellement mis le statut).
 *   2. À défaut, callerId (mis au même moment par l'ancien handler).
 *
 * Écriture en SQL bulk (2 UPDATE) — adapté au volume (milliers de lignes).
 * Idempotent : ne touche que les lignes où attentePaiementById IS NULL.
 * Garde-fou FK : n'écrit un changedBy que s'il correspond à un users.id existant.
 *
 * Usage : SUPABASE_DB_URL="postgresql://..." node scripts-tmp/backfill-attente-paiement-by.mjs
 *   (ou DATABASE_URL). Ajouter --dry pour n'afficher que les estimations sans écrire.
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const DRY = process.argv.includes('--dry');
const prisma = new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

const one = (rows) => (Array.isArray(rows) && rows[0] ? Number(rows[0].n) : 0);

try {
  const before = await prisma.order.count({
    where: { enAttentePaiement: true, attentePaiementById: null },
  });
  console.log(`${before} commande(s) en attente de paiement sans auteur.`);

  if (DRY) {
    const viaHistory = one(await prisma.$queryRawUnsafe(
      `SELECT count(DISTINCT o.id)::int AS n
       FROM orders o JOIN status_history sh ON sh."orderId" = o.id
       WHERE o."enAttentePaiement" = true AND o."attentePaiementById" IS NULL
         AND sh.comment LIKE 'Marquée "En attente de paiement"%'`
    ));
    const viaCaller = one(await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM orders
       WHERE "enAttentePaiement" = true AND "attentePaiementById" IS NULL
         AND "callerId" IS NOT NULL`
    ));
    console.log(`[DRY] Couvrables via historique: ${viaHistory}, via callerId (fallback): ${viaCaller}. Aucune écriture.`);
  } else {
    // 1) Source primaire : la ligne "Marquée En attente de paiement" la plus récente par commande.
    const n1 = await prisma.$executeRawUnsafe(
      `UPDATE orders o SET "attentePaiementById" = sub."changedBy"
       FROM (
         SELECT DISTINCT ON (sh."orderId") sh."orderId", sh."changedBy"
         FROM status_history sh
         WHERE sh.comment LIKE 'Marquée "En attente de paiement"%'
         ORDER BY sh."orderId", sh."createdAt" DESC
       ) sub
       WHERE o.id = sub."orderId"
         AND o."enAttentePaiement" = true
         AND o."attentePaiementById" IS NULL
         AND EXISTS (SELECT 1 FROM users u WHERE u.id = sub."changedBy")`
    );
    // 2) Fallback : callerId (déjà contraint par FK vers users, donc toujours valide).
    const n2 = await prisma.$executeRawUnsafe(
      `UPDATE orders SET "attentePaiementById" = "callerId"
       WHERE "enAttentePaiement" = true
         AND "attentePaiementById" IS NULL
         AND "callerId" IS NOT NULL`
    );
    const after = await prisma.order.count({
      where: { enAttentePaiement: true, attentePaiementById: null },
    });
    console.log(`Backfill terminé : ${n1} via historique, ${n2} via callerId. Restant sans auteur : ${after}.`);
  }
} finally {
  await prisma.$disconnect();
}
