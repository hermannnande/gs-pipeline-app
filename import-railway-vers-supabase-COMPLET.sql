-- ========================================
-- SCRIPT COMPLET D'IMPORT RAILWAY → SUPABASE
-- ========================================
-- Projet: zyeephiasiddilmeguev
-- ⚠️ NE PAS COMMITER ce fichier avec des secrets.
-- ========================================

-- ÉTAPE 1: Créer la connexion vers Railway
-- ========================================

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Supprimer les anciennes connexions si elles existent
DROP USER MAPPING IF EXISTS FOR postgres SERVER railway_server;
DROP SERVER IF EXISTS railway_server CASCADE;

-- Créer le serveur Railway
CREATE SERVER railway_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'switchyard.proxy.rlwy.net', port '37551', dbname 'railway');

-- Créer le mapping utilisateur
CREATE USER MAPPING FOR postgres
SERVER railway_server
OPTIONS (user 'postgres', password 'RAILWAY_PASSWORD_ICI');

-- ========================================
-- ÉTAPE 2: Importer les schémas de Railway
-- ========================================

-- Créer un schéma temporaire pour les tables distantes
CREATE SCHEMA IF NOT EXISTS railway_import;

-- Importer TOUTES les tables de Railway dans le schéma temporaire
IMPORT FOREIGN SCHEMA public
FROM SERVER railway_server
INTO railway_import;

-- ========================================
-- VÉRIFICATION: Lister les tables importées
-- ========================================

-- Afficher toutes les tables qui ont été importées depuis Railway
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'railway_import'
ORDER BY table_name;

-- ⚠️ PAUSE ICI : Vérifier les tables affichées ci-dessus
-- Si certaines tables sont manquantes, ajustez les INSERT ci-dessous

-- ========================================
-- ÉTAPE 3: Nettoyer les tables existantes
-- ========================================

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = replica;

-- Vider toutes les tables dans l'ordre inverse des dépendances
TRUNCATE TABLE 
    message_reactions,
    message_reads,
    messages,
    conversation_participants,
    conversations,
    express_notifications,
    delivery_statistics,
    call_statistics,
    delivery_lists,
    status_history,
    attendances,
    stock_movements,
    tournees_stock,
    orders,
    products,
    store_config,
    users
CASCADE;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- ========================================
-- ÉTAPE 4: Copier les données depuis Railway
-- ========================================

-- ⚠️ IMPORTANT: Copier UNIQUEMENT les tables qui existent dans railway_import
-- Si une table provoque une erreur, commentez la ligne avec -- au début

-- 1. USERS (doit être en premier pour les clés étrangères)
INSERT INTO users 
SELECT * FROM railway_import.users
ON CONFLICT (id) DO NOTHING;

-- 2. PRODUCTS (mapping explicite car Railway n'a pas prix2Unites/prix3Unites)
INSERT INTO products (
    id, code, nom, description, 
    "prixUnitaire", "prix2Unites", "prix3Unites",
    "stockActuel", "stockExpress", "stockLocalReserve", "stockAlerte",
    actif, "createdAt", "updatedAt"
)
SELECT 
    id, 
    code, 
    nom, 
    description,
    "prixUnitaire",
    NULL, -- prix2Unites n'existe pas sur Railway
    NULL, -- prix3Unites n'existe pas sur Railway
    COALESCE("stockActuel", 0),
    COALESCE("stockExpress", 0),
    COALESCE("stockLocalReserve", 0),
    COALESCE("stockAlerte", 10),
    COALESCE(actif, true),
    "createdAt",
    "updatedAt"
FROM railway_import.products
ON CONFLICT (id) DO NOTHING;

-- 3. ORDERS
INSERT INTO orders (
    id,
    "orderReference",
    "clientNom",
    "clientTelephone",
    "clientVille",
    "clientCommune",
    "clientAdresse",
    "produitNom",
    "produitPage",
    "productId",
    quantite,
    montant,
    "deliveryType",
    "montantPaye",
    "montantRestant",
    "modePaiement",
    "referencePayment",
    "sourceCampagne",
    "sourcePage",
    status,
    "callerId",
    "calledAt",
    "nombreAppels",
    "delivererId",
    "deliveryDate",
    "deliveryListId",
    "noteAppelant",
    "noteLivreur",
    "noteGestionnaire",
    "raisonRetour",
    "retourneAt",
    "codeExpedition",
    "photoRecuExpedition",
    "photoRecuExpeditionUploadedAt",
    "clientNotifie",
    "notifieAt",
    "notifiePar",
    "agenceRetrait",
    "expressEnvoyeAt",
    "expressEnvoyePar",
    "codeExpress",
    "photoRecuExpress",
    "photoRecuExpressUploadedAt",
    "enAttentePaiement",
    "attentePaiementAt",
    "rdvProgramme",
    "rdvDate",
    "rdvNote",
    priorite,
    "prioriteAt",
    "prioritePar",
    "rdvProgrammePar",
    "rdvRappele",
    "createdAt",
    "updatedAt",
    "validatedAt",
    "deliveredAt",
    "expedieAt",
    "arriveAt"
)
SELECT
    o.id,
    o."orderReference",
    o."clientNom",
    o."clientTelephone",
    o."clientVille",
    o."clientCommune",
    o."clientAdresse",
    o."produitNom",
    o."produitPage",
    NULLIF(o."productId"::text, '')::integer,
    COALESCE(NULLIF(regexp_replace(o.quantite::text, '[^0-9-]', '', 'g'), '')::integer, 1),
    COALESCE(NULLIF(regexp_replace(replace(o.montant::text, ',', '.'), '[^0-9.-]', '', 'g'), '')::double precision, 0),
    CASE
        WHEN o."deliveryType"::text IN ('LOCAL', 'EXPEDITION', 'EXPRESS') THEN o."deliveryType"::text::"DeliveryType"
        ELSE 'LOCAL'::"DeliveryType"
    END,
    NULLIF(regexp_replace(replace(o."montantPaye"::text, ',', '.'), '[^0-9.-]', '', 'g'), '')::double precision,
    NULLIF(regexp_replace(replace(o."montantRestant"::text, ',', '.'), '[^0-9.-]', '', 'g'), '')::double precision,
    o."modePaiement",
    o."referencePayment",
    o."sourceCampagne",
    o."sourcePage",
    CASE
        WHEN o.status::text IN (
            'NOUVELLE',
            'A_APPELER',
            'VALIDEE',
            'ANNULEE',
            'INJOIGNABLE',
            'ASSIGNEE',
            'LIVREE',
            'REFUSEE',
            'ANNULEE_LIVRAISON',
            'RETOURNE',
            'EXPEDITION',
            'EXPRESS',
            'EXPRESS_ENVOYE',
            'EXPRESS_ARRIVE',
            'EXPRESS_LIVRE'
        ) THEN o.status::text::"OrderStatus"
        ELSE 'NOUVELLE'::"OrderStatus"
    END,
    NULLIF(o."callerId"::text, '')::integer,
    NULLIF(o."calledAt"::text, '')::timestamp(3),
    COALESCE(NULLIF(o."nombreAppels"::text, '')::integer, 0),
    NULLIF(o."delivererId"::text, '')::integer,
    NULLIF(o."deliveryDate"::text, '')::timestamp(3),
    NULLIF(o."deliveryListId"::text, '')::integer,
    o."noteAppelant",
    o."noteLivreur",
    o."noteGestionnaire",
    o."raisonRetour",
    NULLIF(o."retourneAt"::text, '')::timestamp(3),
    o."codeExpedition",
    o."photoRecuExpedition",
    NULLIF(o."photoRecuExpeditionUploadedAt"::text, '')::timestamp(3),
    CASE
        WHEN o."clientNotifie" IS NULL THEN false
        WHEN o."clientNotifie"::text IN ('true', 't', '1', 'yes', 'y') THEN true
        WHEN o."clientNotifie"::text IN ('false', 'f', '0', 'no', 'n') THEN false
        ELSE false
    END,
    NULLIF(o."notifieAt"::text, '')::timestamp(3),
    NULLIF(o."notifiePar"::text, '')::integer,
    o."agenceRetrait",
    NULLIF(o."expressEnvoyeAt"::text, '')::timestamp(3),
    NULLIF(o."expressEnvoyePar"::text, '')::integer,
    o."codeExpress",
    o."photoRecuExpress",
    NULLIF(o."photoRecuExpressUploadedAt"::text, '')::timestamp(3),
    CASE
        WHEN o."enAttentePaiement" IS NULL THEN false
        WHEN o."enAttentePaiement"::text IN ('true', 't', '1', 'yes', 'y') THEN true
        WHEN o."enAttentePaiement"::text IN ('false', 'f', '0', 'no', 'n') THEN false
        ELSE false
    END,
    NULLIF(o."attentePaiementAt"::text, '')::timestamp(3),
    CASE
        WHEN o."rdvProgramme" IS NULL THEN false
        WHEN o."rdvProgramme"::text IN ('true', 't', '1', 'yes', 'y') THEN true
        WHEN o."rdvProgramme"::text IN ('false', 'f', '0', 'no', 'n') THEN false
        ELSE false
    END,
    NULLIF(o."rdvDate"::text, '')::timestamp(3),
    o."rdvNote",
    CASE
        WHEN o.priorite IS NULL THEN false
        WHEN o.priorite::text IN ('true', 't', '1', 'yes', 'y') THEN true
        WHEN o.priorite::text IN ('false', 'f', '0', 'no', 'n') THEN false
        ELSE false
    END,
    NULLIF(o."prioriteAt"::text, '')::timestamp(3),
    NULLIF(o."prioritePar"::text, '')::integer,
    NULLIF(o."rdvProgrammePar"::text, '')::integer,
    CASE
        WHEN o."rdvRappele" IS NULL THEN false
        WHEN o."rdvRappele"::text IN ('true', 't', '1', 'yes', 'y') THEN true
        WHEN o."rdvRappele"::text IN ('false', 'f', '0', 'no', 'n') THEN false
        ELSE false
    END,
    NULLIF(o."createdAt"::text, '')::timestamp(3),
    NULLIF(o."updatedAt"::text, '')::timestamp(3),
    NULLIF(o."validatedAt"::text, '')::timestamp(3),
    NULLIF(o."deliveredAt"::text, '')::timestamp(3),
    NULLIF(o."expedieAt"::text, '')::timestamp(3),
    NULLIF(o."arriveAt"::text, '')::timestamp(3)
FROM railway_import.orders o
ON CONFLICT (id) DO NOTHING;

-- 4. STATUS_HISTORY
INSERT INTO status_history 
SELECT * FROM railway_import.status_history
ON CONFLICT (id) DO NOTHING;

-- 5. DELIVERY_LISTS
INSERT INTO delivery_lists 
SELECT * FROM railway_import.delivery_lists
ON CONFLICT (id) DO NOTHING;

-- 6. CALL_STATISTICS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'call_statistics'
    ) THEN
        INSERT INTO call_statistics 
        SELECT * FROM railway_import.call_statistics
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 7. DELIVERY_STATISTICS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'delivery_statistics'
    ) THEN
        INSERT INTO delivery_statistics 
        SELECT * FROM railway_import.delivery_statistics
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 8. EXPRESS_NOTIFICATIONS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'express_notifications'
    ) THEN
        INSERT INTO express_notifications 
        SELECT * FROM railway_import.express_notifications
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 9. CONVERSATIONS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'conversations'
    ) THEN
        INSERT INTO conversations 
        SELECT * FROM railway_import.conversations
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 10. CONVERSATION_PARTICIPANTS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'conversation_participants'
    ) THEN
        INSERT INTO conversation_participants 
        SELECT * FROM railway_import.conversation_participants
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 11. MESSAGES (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'messages'
    ) THEN
        INSERT INTO messages 
        SELECT * FROM railway_import.messages
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 12. MESSAGE_READS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'message_reads'
    ) THEN
        INSERT INTO message_reads 
        SELECT * FROM railway_import.message_reads
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 13. MESSAGE_REACTIONS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'message_reactions'
    ) THEN
        INSERT INTO message_reactions 
        SELECT * FROM railway_import.message_reactions
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 14. STOCK_MOVEMENTS (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'stock_movements'
    ) THEN
        INSERT INTO stock_movements 
        SELECT * FROM railway_import.stock_movements
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 15. TOURNEES_STOCK (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'tournees_stock'
    ) THEN
        INSERT INTO tournees_stock 
        SELECT * FROM railway_import.tournees_stock
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 16. ATTENDANCES (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'attendances'
    ) THEN
        INSERT INTO attendances 
        SELECT * FROM railway_import.attendances
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 17. STORE_CONFIG (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'railway_import' 
        AND table_name = 'store_config'
    ) THEN
        INSERT INTO store_config 
        SELECT * FROM railway_import.store_config
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- ÉTAPE 5: Réinitialiser les séquences
-- ========================================

-- Réinitialiser les auto-increment pour chaque table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Pour chaque table, réinitialiser sa séquence si elle existe
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('SELECT setval(pg_get_serial_sequence(''%I'', ''id''), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM %I', 
                          r.table_name, r.table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignorer les erreurs (table sans id ou sans séquence)
            NULL;
        END;
    END LOOP;
END $$;

-- ========================================
-- ÉTAPE 6: Nettoyage
-- ========================================

-- Supprimer le schéma temporaire
DROP SCHEMA railway_import CASCADE;

-- Supprimer la connexion Railway
DROP USER MAPPING FOR postgres SERVER railway_server;
DROP SERVER railway_server CASCADE;

-- ========================================
-- ÉTAPE 7: Vérification
-- ========================================

-- Compter les lignes de chaque table importée
DO $$
DECLARE
    r RECORD;
    cnt INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RÉSUMÉ DE L''IMPORT';
    RAISE NOTICE '========================================';
    
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO cnt;
        RAISE NOTICE '%-30s: % lignes', r.table_name, cnt;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- ✅ IMPORT TERMINÉ !
-- ========================================
-- Vos données Railway sont maintenant dans Supabase
-- 
-- PROCHAINES ÉTAPES :
-- 1. Vérifier les comptages ci-dessus
-- 2. Tester votre application en local avec la nouvelle DATABASE_URL
-- 3. Mettre à jour DATABASE_URL en production quand tout fonctionne
-- ========================================
