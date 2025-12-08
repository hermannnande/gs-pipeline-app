-- Ajouter le nouveau statut RETOURNE
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETOURNE';

-- Ajouter les champs de gestion des retours
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "raisonRetour" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "retourneAt" TIMESTAMP(3);




