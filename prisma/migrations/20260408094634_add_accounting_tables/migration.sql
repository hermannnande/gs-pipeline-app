-- CreateTable: Depenses publicitaires
CREATE TABLE "ad_expenses" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "date" DATE NOT NULL,
    "platform" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "companyId" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Achats fournisseur
CREATE TABLE "supplier_purchases" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "date" DATE NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "prixTotal" DOUBLE PRECISION NOT NULL,
    "fraisDedouanement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fraisTransport" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autreFrais" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coutTotalRevient" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "companyId" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Config comptabilite
CREATE TABLE "accounting_config" (
    "id" SERIAL NOT NULL,
    "commissionLivreurLocal" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "companyId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounting_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_expenses_productId_idx" ON "ad_expenses"("productId");
CREATE INDEX "ad_expenses_date_idx" ON "ad_expenses"("date");
CREATE INDEX "ad_expenses_platform_idx" ON "ad_expenses"("platform");
CREATE INDEX "ad_expenses_companyId_idx" ON "ad_expenses"("companyId");

CREATE INDEX "supplier_purchases_productId_idx" ON "supplier_purchases"("productId");
CREATE INDEX "supplier_purchases_date_idx" ON "supplier_purchases"("date");
CREATE INDEX "supplier_purchases_companyId_idx" ON "supplier_purchases"("companyId");

CREATE UNIQUE INDEX "accounting_config_companyId_key" ON "accounting_config"("companyId");

-- AddForeignKey
ALTER TABLE "ad_expenses" ADD CONSTRAINT "ad_expenses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "supplier_purchases" ADD CONSTRAINT "supplier_purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default config
INSERT INTO "accounting_config" ("commissionLivreurLocal", "companyId") VALUES (1500, 1) ON CONFLICT ("companyId") DO NOTHING;
