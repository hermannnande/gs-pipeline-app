-- Add EXPRESS_ENVOYE status + fields to track shipping to agency

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'EXPRESS_ENVOYE'
  ) THEN
    ALTER TYPE "OrderStatus" ADD VALUE 'EXPRESS_ENVOYE';
  END IF;
END $$;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "expressEnvoyeAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expressEnvoyePar" INTEGER,
  ADD COLUMN IF NOT EXISTS "codeExpress" TEXT,
  ADD COLUMN IF NOT EXISTS "photoRecuExpress" TEXT,
  ADD COLUMN IF NOT EXISTS "photoRecuExpressUploadedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "orders_expressEnvoyeAt_idx" ON "orders"("expressEnvoyeAt");
