-- AlterTable
ALTER TABLE "orders" ADD COLUMN "enAttentePaiement" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "attentePaiementAt" TIMESTAMP(3);

