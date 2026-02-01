-- Recalage des séquences après import (SERIAL / sequences)
-- But: éviter les collisions d'ID lors des prochaines insertions

DO $$
DECLARE
  r record;
  max_id bigint;
BEGIN
  FOR r IN
    SELECT
      ns.nspname AS schema_name,
      seq.relname AS sequence_name,
      tbl.relname AS table_name,
      attr.attname AS column_name
    FROM pg_class seq
    JOIN pg_namespace ns ON ns.oid = seq.relnamespace
    JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
    JOIN pg_class tbl ON tbl.oid = dep.refobjid
    JOIN pg_attribute attr ON attr.attrelid = tbl.oid AND attr.attnum = dep.refobjsubid
    WHERE seq.relkind = 'S'
      AND ns.nspname = 'public'
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.column_name, r.schema_name, r.table_name)
      INTO max_id;

    -- setval(seq, max, is_called=true) pour que nextval() rende max+1
    EXECUTE format('SELECT setval(%L, %s, true)', format('%I.%I', r.schema_name, r.sequence_name), max_id);
  END LOOP;
END $$;

