-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('APPROVISIONNEMENT', 'LIVRAISON', 'RETOUR', 'CORRECTION', 'PERTE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'GESTIONNAIRE_STOCK';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "productId" INTEGER;

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "stockActuel" INTEGER NOT NULL DEFAULT 0,
    "stockAlerte" INTEGER NOT NULL DEFAULT 10,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "stockAvant" INTEGER NOT NULL,
    "stockApres" INTEGER NOT NULL,
    "orderId" INTEGER,
    "tourneeId" INTEGER,
    "effectuePar" INTEGER NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournees_stock" (
    "id" SERIAL NOT NULL,
    "deliveryListId" INTEGER NOT NULL,
    "colisRemis" INTEGER NOT NULL DEFAULT 0,
    "colisRemisConfirme" BOOLEAN NOT NULL DEFAULT false,
    "colisRemisAt" TIMESTAMP(3),
    "colisRemisBy" INTEGER,
    "colisLivres" INTEGER NOT NULL DEFAULT 0,
    "colisRetour" INTEGER NOT NULL DEFAULT 0,
    "colisRetourConfirme" BOOLEAN NOT NULL DEFAULT false,
    "colisRetourAt" TIMESTAMP(3),
    "colisRetourBy" INTEGER,
    "ecart" INTEGER NOT NULL DEFAULT 0,
    "ecartResolu" BOOLEAN NOT NULL DEFAULT false,
    "ecartMotif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournees_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_code_idx" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_actif_idx" ON "products"("actif");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_tourneeId_idx" ON "stock_movements"("tourneeId");

-- CreateIndex
CREATE UNIQUE INDEX "tournees_stock_deliveryListId_key" ON "tournees_stock"("deliveryListId");

-- CreateIndex
CREATE INDEX "tournees_stock_deliveryListId_idx" ON "tournees_stock"("deliveryListId");

-- CreateIndex
CREATE INDEX "tournees_stock_colisRemisConfirme_idx" ON "tournees_stock"("colisRemisConfirme");

-- CreateIndex
CREATE INDEX "tournees_stock_colisRetourConfirme_idx" ON "tournees_stock"("colisRetourConfirme");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "tournees_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournees_stock" ADD CONSTRAINT "tournees_stock_deliveryListId_fkey" FOREIGN KEY ("deliveryListId") REFERENCES "delivery_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
