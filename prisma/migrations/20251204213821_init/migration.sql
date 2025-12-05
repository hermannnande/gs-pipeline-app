-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTIONNAIRE', 'APPELANT', 'LIVREUR');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NOUVELLE', 'A_APPELER', 'VALIDEE', 'ANNULEE', 'INJOIGNABLE', 'ASSIGNEE', 'LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "UserRole" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "orderReference" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientTelephone" TEXT NOT NULL,
    "clientVille" TEXT NOT NULL,
    "clientCommune" TEXT,
    "clientAdresse" TEXT,
    "produitNom" TEXT NOT NULL,
    "produitPage" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "montant" DOUBLE PRECISION NOT NULL,
    "sourceCampagne" TEXT,
    "sourcePage" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'NOUVELLE',
    "callerId" INTEGER,
    "calledAt" TIMESTAMP(3),
    "delivererId" INTEGER,
    "deliveryDate" TIMESTAMP(3),
    "deliveryListId" INTEGER,
    "noteAppelant" TEXT,
    "noteLivreur" TEXT,
    "noteGestionnaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "oldStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_lists" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "delivererId" INTEGER NOT NULL,
    "zone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_statistics" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAppels" INTEGER NOT NULL DEFAULT 0,
    "totalValides" INTEGER NOT NULL DEFAULT 0,
    "totalAnnules" INTEGER NOT NULL DEFAULT 0,
    "totalInjoignables" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_statistics" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLivraisons" INTEGER NOT NULL DEFAULT 0,
    "totalRefusees" INTEGER NOT NULL DEFAULT 0,
    "totalAnnulees" INTEGER NOT NULL DEFAULT 0,
    "montantLivre" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderReference_key" ON "orders"("orderReference");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_clientTelephone_idx" ON "orders"("clientTelephone");

-- CreateIndex
CREATE INDEX "orders_clientVille_idx" ON "orders"("clientVille");

-- CreateIndex
CREATE INDEX "orders_deliveryDate_idx" ON "orders"("deliveryDate");

-- CreateIndex
CREATE INDEX "orders_callerId_idx" ON "orders"("callerId");

-- CreateIndex
CREATE INDEX "orders_delivererId_idx" ON "orders"("delivererId");

-- CreateIndex
CREATE INDEX "status_history_orderId_idx" ON "status_history"("orderId");

-- CreateIndex
CREATE INDEX "delivery_lists_delivererId_date_idx" ON "delivery_lists"("delivererId", "date");

-- CreateIndex
CREATE INDEX "call_statistics_userId_date_idx" ON "call_statistics"("userId", "date");

-- CreateIndex
CREATE INDEX "delivery_statistics_userId_date_idx" ON "delivery_statistics"("userId", "date");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivererId_fkey" FOREIGN KEY ("delivererId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryListId_fkey" FOREIGN KEY ("deliveryListId") REFERENCES "delivery_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_lists" ADD CONSTRAINT "delivery_lists_delivererId_fkey" FOREIGN KEY ("delivererId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_statistics" ADD CONSTRAINT "call_statistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_statistics" ADD CONSTRAINT "delivery_statistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
