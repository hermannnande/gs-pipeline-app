-- AlterEnum : Ajouter les nouveaux statuts de commande
ALTER TYPE "OrderStatus" ADD VALUE 'EXPEDITION';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS_ARRIVE';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS_LIVRE';

-- CreateEnum : Type de livraison
CREATE TYPE "DeliveryType" AS ENUM ('LOCAL', 'EXPEDITION', 'EXPRESS');

-- AlterTable : Ajouter les colonnes pour la gestion des expéditions et express
ALTER TABLE "orders" ADD COLUMN "deliveryType" "DeliveryType" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "orders" ADD COLUMN "montantPaye" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "montantRestant" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "modePaiement" TEXT;
ALTER TABLE "orders" ADD COLUMN "referencePayment" TEXT;
ALTER TABLE "orders" ADD COLUMN "clientNotifie" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "notifieAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "notifiePar" INTEGER;
ALTER TABLE "orders" ADD COLUMN "agenceRetrait" TEXT;
ALTER TABLE "orders" ADD COLUMN "expedieAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "arriveAt" TIMESTAMP(3);

