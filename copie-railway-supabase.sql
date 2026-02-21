-- Script SQL pour copier les données de Railway vers Supabase
-- À exécuter dans le SQL Editor Supabase

-- Créer une foreign data wrapper pour Railway
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER railway_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'switchyard.proxy.rlwy.net', port '37551', dbname 'railway');

CREATE USER MAPPING FOR postgres
SERVER railway_server
OPTIONS (user 'postgres', password 'RAILWAY_PASSWORD_ICI');

-- Créer les foreign tables (exemples pour users et products)
IMPORT FOREIGN SCHEMA public
LIMIT TO (users, products, orders, status_history, delivery_lists, call_statistics, delivery_statistics, express_notifications, conversations, conversation_participants, messages, message_reads, message_reactions, stock_movements, tournees_stock, attendances, store_config)
FROM SERVER railway_server
INTO public;

-- Copier les données (à adapter selon vos tables)
-- Exemple pour users :
-- INSERT INTO users_local SELECT * FROM users;
