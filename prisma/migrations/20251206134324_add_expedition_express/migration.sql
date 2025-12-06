-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('LOCAL', 'EXPEDITION', 'EXPRESS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'EXPEDITION';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS_ARRIVE';
ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS_LIVRE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "agenceRetrait" TEXT,
ADD COLUMN     "arriveAt" TIMESTAMP(3),
ADD COLUMN     "clientNotifie" BOOLEAN DEFAULT false,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "expedieAt" TIMESTAMP(3),
ADD COLUMN     "modePaiement" TEXT,
ADD COLUMN     "montantPaye" DOUBLE PRECISION,
ADD COLUMN     "montantRestant" DOUBLE PRECISION,
ADD COLUMN     "notifieAt" TIMESTAMP(3),
ADD COLUMN     "notifiePar" INTEGER,
ADD COLUMN     "referencePayment" TEXT;
