-- Migration : Livraison partielle
-- Date : 2026-05-26
-- Description : Permet au livreur de marquer une commande comme "partiellement livrée"
--               (ex: client commande 2, prend 1 → 1 livré + 1 retour magasin)
--
-- Changements :
--   1. Ajout valeur `LIVREE_PARTIELLE` à l'enum `OrderStatus`
--   2. Ajout colonne `quantiteLivree` (Int nullable) sur la table `Order`
--      - NULL = rétrocompat (= quantite quand status=LIVREE)
--      - Renseigné quand status=LIVREE_PARTIELLE
--
-- Sécurité : modifications additives uniquement, aucune perte de données.

-- 1. Ajouter la valeur LIVREE_PARTIELLE à l'enum OrderStatus
-- Note : PostgreSQL n'autorise pas ALTER TYPE ADD VALUE dans une transaction,
-- mais Prisma le gère hors transaction automatiquement.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'LIVREE_PARTIELLE';

-- 2. Ajouter la colonne quantiteLivree (nullable, sans default)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quantiteLivree" INTEGER;

-- 3. Index optionnel pour les requêtes filtrant par status LIVREE_PARTIELLE
-- (les requêtes existantes filtrent déjà sur status, donc l'index global est suffisant)
