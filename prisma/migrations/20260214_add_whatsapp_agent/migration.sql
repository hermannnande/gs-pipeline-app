-- CreateEnum
CREATE TYPE "WaConversationStatus" AS ENUM ('OPEN', 'BOT_ACTIVE', 'HUMAN_HANDOFF', 'WAITING_CUSTOMER', 'RESOLVED', 'ARCHIVED');
CREATE TYPE "WaMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "WaMessageActor" AS ENUM ('CUSTOMER', 'BOT', 'HUMAN', 'SYSTEM');
CREATE TYPE "WaMessageContentType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION', 'STICKER', 'REACTION', 'SYSTEM');
CREATE TYPE "WaConvState" AS ENUM ('NEW', 'GREETING', 'ASKING_PRODUCT', 'ASKING_QUANTITY', 'ASKING_NAME', 'ASKING_PHONE', 'ASKING_LOCATION', 'ASKING_ADDRESS', 'CONFIRMING_ORDER', 'HUMAN_HANDOFF', 'COMPLETED', 'FAQ');
CREATE TYPE "WaHandoffReason" AS ENUM ('CUSTOMER_REQUEST', 'LOW_CONFIDENCE', 'COMPLAINT', 'UNKNOWN_INTENT', 'PRODUCT_NOT_FOUND', 'COMPLEX_QUESTION', 'MULTIPLE_FAILURES', 'MANUAL');

-- CreateTable wa_conversations
CREATE TABLE "wa_conversations" (
    "id" SERIAL NOT NULL,
    "waId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "status" "WaConversationStatus" NOT NULL DEFAULT 'OPEN',
    "convState" "WaConvState" NOT NULL DEFAULT 'NEW',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER NOT NULL DEFAULT 1,
    "assignedUserId" INTEGER,
    "extractedProduct" TEXT,
    "extractedProductId" INTEGER,
    "extractedQty" INTEGER,
    "extractedName" TEXT,
    "extractedPhone" TEXT,
    "extractedCity" TEXT,
    "extractedCommune" TEXT,
    "extractedAddress" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "orderId" INTEGER,
    "lastIntent" TEXT,
    "lastBotMessage" TEXT,
    "handoffReason" "WaHandoffReason",
    "handoffAt" TIMESTAMP(3),
    "handoffBy" INTEGER,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wa_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable wa_messages
CREATE TABLE "wa_messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "direction" "WaMessageDirection" NOT NULL,
    "actor" "WaMessageActor" NOT NULL DEFAULT 'CUSTOMER',
    "contentType" "WaMessageContentType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "externalId" TEXT,
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "mediaFilename" TEXT,
    "transcription" TEXT,
    "transcriptionOk" BOOLEAN,
    "senderUserId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wa_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable wa_rules_logs
CREATE TABLE "wa_rules_logs" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "inputText" TEXT,
    "detectedIntent" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "extractedData" TEXT,
    "actionTaken" TEXT,
    "responseChosen" TEXT,
    "convStateBefore" TEXT,
    "convStateAfter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wa_rules_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wa_conversations_waId_companyId_key" ON "wa_conversations"("waId", "companyId");
CREATE INDEX "wa_conversations_status_idx" ON "wa_conversations"("status");
CREATE INDEX "wa_conversations_companyId_idx" ON "wa_conversations"("companyId");
CREATE INDEX "wa_conversations_assignedUserId_idx" ON "wa_conversations"("assignedUserId");
CREATE INDEX "wa_conversations_lastMessageAt_idx" ON "wa_conversations"("lastMessageAt");

CREATE UNIQUE INDEX "wa_messages_externalId_key" ON "wa_messages"("externalId");
CREATE INDEX "wa_messages_conversationId_idx" ON "wa_messages"("conversationId");
CREATE INDEX "wa_messages_timestamp_idx" ON "wa_messages"("timestamp");

CREATE INDEX "wa_rules_logs_conversationId_idx" ON "wa_rules_logs"("conversationId");
CREATE INDEX "wa_rules_logs_createdAt_idx" ON "wa_rules_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "wa_conversations" ADD CONSTRAINT "wa_conversations_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wa_messages" ADD CONSTRAINT "wa_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "wa_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wa_rules_logs" ADD CONSTRAINT "wa_rules_logs_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "wa_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
