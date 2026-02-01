-- Préparation import Railway -> Supabase
-- Objectif: rendre les FKs deferrable et importer sans erreurs d'ordre (cycles)

-- Nettoyage (si jamais il y a déjà des données)
TRUNCATE TABLE
  message_reactions,
  message_reads,
  messages,
  conversation_participants,
  conversations,
  express_notifications,
  delivery_statistics,
  call_statistics,
  status_history,
  orders,
  tournees_stock,
  stock_movements,
  delivery_lists,
  attendances,
  store_config,
  products,
  users
RESTART IDENTITY
CASCADE;

-- Rendre toutes les clés étrangères de public deferrable
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT con.conname, con.conrelid::regclass AS tbl
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND con.condeferrable = false
  ) LOOP
    EXECUTE format(
      'ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',
      r.tbl,
      r.conname
    );
  END LOOP;
END $$;

-- Les contraintes seront vérifiées au COMMIT (dans la transaction unique)
-- Note: cette commande nécessite d'être dans une transaction.
-- Elle n'est pas indispensable si les contraintes sont INITIALLY DEFERRED.
-- SET CONSTRAINTS ALL DEFERRED;

