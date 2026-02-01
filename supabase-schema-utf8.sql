-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NOUVELLE', 'A_APPELER', 'VALIDEE', 'ANNULEE', 'INJOIGNABLE', 'ASSIGNEE', 'LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE', 'EXPEDITION', 'EXPRESS', 'EXPRESS_ENVOYE', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('LOCAL', 'EXPEDITION', 'EXPRESS');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('PRIVATE', 'GROUP', 'BROADCAST');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('APPROVISIONNEMENT', 'LIVRAISON', 'RETOUR', 'CORRECTION', 'PERTE', 'RESERVATION', 'RESERVATION_EXPRESS', 'RETRAIT_EXPRESS', 'ANNULATION_EXPRESS', 'RESERVATION_LOCAL', 'LIVRAISON_LOCAL', 'RETOUR_LOCAL', 'CORRECTION_LIVRAISON_LOCAL', 'RETOUR_EXPEDITION', 'CORRECTION_EXPRESS', 'AJUSTEMENT');

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
    "productId" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "montant" DOUBLE PRECISION NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'LOCAL',
    "montantPaye" DOUBLE PRECISION,
    "montantRestant" DOUBLE PRECISION,
    "modePaiement" TEXT,
    "referencePayment" TEXT,
    "sourceCampagne" TEXT,
    "sourcePage" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'NOUVELLE',
    "callerId" INTEGER,
    "calledAt" TIMESTAMP(3),
    "nombreAppels" INTEGER NOT NULL DEFAULT 0,
    "delivererId" INTEGER,
    "deliveryDate" TIMESTAMP(3),
    "deliveryListId" INTEGER,
    "noteAppelant" TEXT,
    "noteLivreur" TEXT,
    "noteGestionnaire" TEXT,
    "raisonRetour" TEXT,
    "retourneAt" TIMESTAMP(3),
    "codeExpedition" TEXT,
    "photoRecuExpedition" TEXT,
    "photoRecuExpeditionUploadedAt" TIMESTAMP(3),
    "clientNotifie" BOOLEAN DEFAULT false,
    "notifieAt" TIMESTAMP(3),
    "notifiePar" INTEGER,
    "agenceRetrait" TEXT,
    "expressEnvoyeAt" TIMESTAMP(3),
    "expressEnvoyePar" INTEGER,
    "codeExpress" TEXT,
    "photoRecuExpress" TEXT,
    "photoRecuExpressUploadedAt" TIMESTAMP(3),
    "enAttentePaiement" BOOLEAN NOT NULL DEFAULT false,
    "attentePaiementAt" TIMESTAMP(3),
    "rdvProgramme" BOOLEAN NOT NULL DEFAULT false,
    "rdvDate" TIMESTAMP(3),
    "rdvNote" TEXT,
    "priorite" BOOLEAN NOT NULL DEFAULT false,
    "prioriteAt" TIMESTAMP(3),
    "prioritePar" INTEGER,
    "rdvProgrammePar" INTEGER,
    "rdvRappele" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "expedieAt" TIMESTAMP(3),
    "arriveAt" TIMESTAMP(3),

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

-- CreateTable
CREATE TABLE "express_notifications" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "note" TEXT,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "express_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'PRIVATE',
    "name" TEXT,
    "description" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileMimeType" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "replyToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "prix2Unites" DOUBLE PRECISION,
    "prix3Unites" DOUBLE PRECISION,
    "stockActuel" INTEGER NOT NULL DEFAULT 0,
    "stockExpress" INTEGER NOT NULL DEFAULT 0,
    "stockLocalReserve" INTEGER NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureArrivee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureDepart" TIMESTAMP(3),
    "latitudeArrivee" DOUBLE PRECISION NOT NULL,
    "longitudeArrivee" DOUBLE PRECISION NOT NULL,
    "distanceArrivee" DOUBLE PRECISION NOT NULL,
    "storeLocationId" INTEGER,
    "latitudeDepart" DOUBLE PRECISION,
    "longitudeDepart" DOUBLE PRECISION,
    "distanceDepart" DOUBLE PRECISION,
    "validee" BOOLEAN NOT NULL DEFAULT false,
    "validation" TEXT,
    "note" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_config" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Magasin Principal',
    "adresse" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rayonTolerance" INTEGER NOT NULL DEFAULT 50,
    "heureOuverture" TEXT NOT NULL DEFAULT '08:00',
    "heureFermeture" TEXT NOT NULL DEFAULT '18:00',
    "toleranceRetard" INTEGER NOT NULL DEFAULT 15,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_config_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "express_notifications_orderId_idx" ON "express_notifications"("orderId");

-- CreateIndex
CREATE INDEX "express_notifications_userId_idx" ON "express_notifications"("userId");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "message_reads_userId_idx" ON "message_reads"("userId");

-- CreateIndex
CREATE INDEX "message_reads_messageId_idx" ON "message_reads"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_messageId_userId_key" ON "message_reads"("messageId", "userId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

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

-- CreateIndex
CREATE INDEX "attendances_userId_idx" ON "attendances"("userId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_validee_idx" ON "attendances"("validee");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_userId_date_key" ON "attendances"("userId", "date");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "express_notifications" ADD CONSTRAINT "express_notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "express_notifications" ADD CONSTRAINT "express_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "tournees_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournees_stock" ADD CONSTRAINT "tournees_stock_deliveryListId_fkey" FOREIGN KEY ("deliveryListId") REFERENCES "delivery_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

