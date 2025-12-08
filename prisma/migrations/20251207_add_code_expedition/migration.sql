-- Ajouter le champ codeExpedition pour les EXPEDITION
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "codeExpedition" TEXT;



