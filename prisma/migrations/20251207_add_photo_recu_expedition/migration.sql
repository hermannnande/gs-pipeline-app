-- Ajouter le champ photoRecuExpedition pour stocker la photo du reçu
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "photoRecuExpedition" TEXT;



