-- Nettoyage complet de la base Supabase avant import
-- Ce script supprime toutes les tables et types existants

-- Supprimer toutes les tables (dans l'ordre des dépendances)
DROP TABLE IF EXISTS "message_reactions" CASCADE;
DROP TABLE IF EXISTS "message_reads" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "conversation_participants" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "express_notifications" CASCADE;
DROP TABLE IF EXISTS "delivery_statistics" CASCADE;
DROP TABLE IF EXISTS "call_statistics" CASCADE;
DROP TABLE IF EXISTS "attendances" CASCADE;
DROP TABLE IF EXISTS "store_config" CASCADE;
DROP TABLE IF EXISTS "tournees_stock" CASCADE;
DROP TABLE IF EXISTS "stock_movements" CASCADE;
DROP TABLE IF EXISTS "status_history" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "delivery_lists" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Supprimer tous les types ENUM
DROP TYPE IF EXISTS "StockMovementType" CASCADE;
DROP TYPE IF EXISTS "MessageType" CASCADE;
DROP TYPE IF EXISTS "ConversationType" CASCADE;
DROP TYPE IF EXISTS "DeliveryType" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- Confirmation
SELECT 'Base nettoyée avec succès - Vous pouvez maintenant exécuter supabase-schema-utf8.sql' as message;
