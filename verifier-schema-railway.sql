-- ========================================
-- SCRIPT DE VÉRIFICATION DU SCHÉMA RAILWAY
-- ========================================
-- À exécuter AVANT l'import pour voir les différences
-- ========================================

-- Créer la connexion Railway
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

DROP USER MAPPING IF EXISTS FOR postgres SERVER railway_server;
DROP SERVER IF EXISTS railway_server CASCADE;

CREATE SERVER railway_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'switchyard.proxy.rlwy.net', port '37551', dbname 'railway');

CREATE USER MAPPING FOR postgres
SERVER railway_server
OPTIONS (user 'postgres', password 'RAILWAY_PASSWORD_ICI');

-- Importer les tables
CREATE SCHEMA IF NOT EXISTS railway_import;
IMPORT FOREIGN SCHEMA public
FROM SERVER railway_server
INTO railway_import;

-- ========================================
-- VÉRIFIER LE SCHÉMA DE LA TABLE PRODUCTS
-- ========================================

-- Afficher toutes les colonnes de products avec leur type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'railway_import'
AND table_name = 'products'
ORDER BY ordinal_position;

-- ========================================
-- AFFICHER UN EXEMPLE DE DONNÉES
-- ========================================

SELECT * FROM railway_import.products LIMIT 3;

-- ========================================
-- NETTOYAGE
-- ========================================

DROP SCHEMA railway_import CASCADE;
DROP USER MAPPING FOR postgres SERVER railway_server;
DROP SERVER railway_server CASCADE;
