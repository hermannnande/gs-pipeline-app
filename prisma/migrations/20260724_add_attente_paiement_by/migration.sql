-- Colonne orders.attentePaiementById : employé/gestionnaire qui a marqué une commande
-- "en attente de paiement". Attribution visible ADMIN uniquement (cf. schema.prisma).
--
-- Idempotent : la colonne/contrainte a pu être ajoutée en prod via
-- scripts-tmp/migrate-attente-paiement-by.mjs. Ce fichier officialise la migration
-- pour toute base recréée à partir de zéro, sans casser une base où elle existe déjà.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "attentePaiementById" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_attentePaiementById_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_attentePaiementById_fkey"
      FOREIGN KEY ("attentePaiementById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
