-- Ajouter le champ priorite aux commandes
ALTER TABLE "orders" ADD COLUMN "priorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "prioriteAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "prioritePar" INTEGER;

-- Index pour améliorer les performances de tri
CREATE INDEX "orders_priorite_createdAt_idx" ON "orders"("priorite" DESC, "createdAt" DESC);
