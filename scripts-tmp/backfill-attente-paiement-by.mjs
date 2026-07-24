/**
 * Backfill : renseigne orders.attentePaiementById pour les commandes déjà
 * marquées "en attente de paiement" AVANT l'ajout de la colonne, en lisant
 * status_history (comment LIKE '%ttente de paiement%', changedBy = auteur).
 * Idempotent.
 *
 * Usage : SUPABASE_DB_URL="postgresql://..." node scripts-tmp/backfill-attente-paiement-by.mjs
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error('SUPABASE_DB_URL manquant'); process.exit(1); }

const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  const orders = await prisma.order.findMany({
    where: { enAttentePaiement: true, attentePaiementById: null },
    select: { id: true },
  });
  console.log(`${orders.length} commande(s) en attente de paiement sans auteur.`);

  let done = 0, miss = 0;
  for (const o of orders) {
    const h = await prisma.statusHistory.findFirst({
      where: { orderId: o.id, comment: { contains: 'ttente de paiement', mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      select: { changedBy: true },
    });
    if (h?.changedBy) {
      await prisma.order.update({ where: { id: o.id }, data: { attentePaiementById: h.changedBy } });
      done++;
    } else {
      miss++;
    }
  }
  console.log(`Backfill terminé : ${done} renseignée(s), ${miss} sans historique trouvé.`);
} finally {
  await prisma.$disconnect();
}
