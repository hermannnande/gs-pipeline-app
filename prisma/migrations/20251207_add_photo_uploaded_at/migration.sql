-- Ajouter le champ photoRecuExpeditionUploadedAt pour tracer la date d'upload
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "photoRecuExpeditionUploadedAt" TIMESTAMP(3);



