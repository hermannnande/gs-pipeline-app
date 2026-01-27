-- Ajouter support multi-sites pour le pointage GPS

-- Ajouter le champ actif pour StoreConfig
ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "actif" BOOLEAN NOT NULL DEFAULT true;

-- Ajouter le champ storeLocationId pour Attendance (bureau utilisé)
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "storeLocationId" INTEGER;
