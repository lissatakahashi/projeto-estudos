-- Versão ampliada da RPC que retorna metadados detalhados da tabela
-- Uso: POST /rest/v1/rpc/describe_table_plus com body {"p_schema":"public","p_table":"users"}
CREATE OR REPLACE FUNCTION public.describe_table_plus(p_schema text, p_table text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  rel regclass;
  cols jsonb; cons jsonb; idxs jsonb;
  owner_acl jsonb; comments jsonb;
  triggers jsonb; rls jsonb; policies jsonb;
  part jsonb; inherits jsonb;
  repl jsonb; sizes jsonb; stats jsonb;
  seqs jsonb; collgen jsonb;
  pk_arr smallint[]; pk_cols jsonb;
  rules jsonb; depends jsonb; ext jsonb;
BEGIN
  -- valida existencia e monta rel
  BEGIN
    rel := (p_schema || '.' || p_table)::regclass;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', format('Tabela %s.%s não encontrada', p_schema, p_table));
  END;

  -- Colunas
  SELECT jsonb_agg(jsonb_build_object(
    'name', a.attname,
    'type', format_type(a.atttypid, a.atttypmod),
    'default', pg_get_expr(ad.adbin, ad.adrelid),
    'notnull', a.attnotnull
  ) ORDER BY a.attnum)
  INTO cols
  FROM pg_attribute a
  LEFT JOIN pg_attrdef ad ON a.attrelid=ad.adrelid AND a.attnum=ad.adnum
  WHERE a.attrelid = rel
    AND a.attnum > 0 AND NOT a.attisdropped;

  -- Constraints
  SELECT jsonb_agg(jsonb_build_object(
    'name', conname, 'type', contype, 'def', pg_get_constraintdef(oid)
  ) ORDER BY contype != 'p', conname)
  INTO cons
  FROM pg_constraint
  WHERE conrelid = rel;

  -- Primary key columns (as JSON array). We try to read the conkey (smallint[])
  -- and then map attribute numbers to names preserving order.
  SELECT conkey INTO pk_arr
  FROM pg_constraint
  WHERE conrelid = rel AND contype = 'p'
  LIMIT 1;

  IF pk_arr IS NOT NULL THEN
    SELECT jsonb_agg(a.attname ORDER BY array_position(pk_arr, a.attnum))
    INTO pk_cols
    FROM pg_attribute a
    WHERE a.attrelid = rel AND a.attnum = ANY(pk_arr);
  END IF;

  -- Indexes (não primários)
  SELECT jsonb_agg(jsonb_build_object(
    'def', pg_get_indexdef(i.indexrelid),
    'tablespace', COALESCE((SELECT spcname FROM pg_tablespace WHERE oid = c2.reltablespace), 'pg_default')
  ))
  INTO idxs
  FROM pg_index i
  JOIN pg_class c2 ON c2.oid = i.indexrelid
  WHERE i.indrelid = rel AND NOT i.indisprimary;

  -- Owner/ACL/Table comment
  SELECT jsonb_build_object(
    'owner', r.rolname,
    'acl', c.relacl,
    'table_comment', obj_description(c.oid,'pg_class'),
    'tablespace', COALESCE((SELECT spcname FROM pg_tablespace WHERE oid = c.reltablespace), 'pg_default')
  )
  INTO owner_acl
  FROM pg_class c
  JOIN pg_roles r ON r.oid=c.relowner
  WHERE c.oid = rel;

  -- Column comments
  SELECT jsonb_agg(jsonb_build_object('column', a.attname, 'comment', col_description(c.oid,a.attnum)))
  INTO comments
  FROM pg_class c
  JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
  WHERE c.oid = rel;

  -- Triggers
  SELECT jsonb_agg(jsonb_build_object('name', tgname, 'def', pg_get_triggerdef(t.oid,true), 'enabled', t.tgenabled))
  INTO triggers
  FROM pg_trigger t
  WHERE t.tgrelid=rel AND NOT t.tgisinternal;

  -- RLS flags
  SELECT jsonb_build_object('row_security', c.relrowsecurity, 'force_row_security', c.relforcerowsecurity)
  INTO rls
  FROM pg_class c WHERE c.oid=rel;

  -- Policies
  SELECT jsonb_agg(jsonb_build_object(
    'name', polname, 'cmd', polcmd, 'roles', polroles::text,
    'using', pg_get_expr(polqual, polrelid),
    'with_check', pg_get_expr(polwithcheck, polrelid)
  ))
  INTO policies
  FROM pg_policy WHERE polrelid=rel;

  -- Partitioned / Inheritance
  SELECT to_jsonb(p) INTO part FROM pg_partitioned_table p WHERE p.partrelid=rel;
  SELECT jsonb_agg(jsonb_build_object('parent', inhparent::regclass::text, 'child', inhrelid::regclass::text))
  INTO inherits
  FROM pg_inherits WHERE inhparent=rel OR inhrelid=rel;

  -- Replica identity / reloptions
  SELECT jsonb_build_object('replica_identity', c.relreplident, 'reloptions', c.reloptions)
  INTO repl FROM pg_class c WHERE c.oid=rel;

  -- Sizes
  SELECT jsonb_build_object(
    'total_bytes', pg_total_relation_size(rel),
    'table_bytes', pg_relation_size(rel),
    'indexes_bytes', pg_indexes_size(rel),
    'toast_total_bytes', pg_total_relation_size(c.reltoastrelid)
  )
  INTO sizes
  FROM pg_class c WHERE c.oid=rel;

  -- Stats
  SELECT to_jsonb(s) INTO stats
  FROM pg_stat_all_tables s WHERE s.relid=rel;

  -- Sequences owned-by e identity (inclui nome qualificado)
  SELECT jsonb_agg(jsonb_build_object('sequence', n.nspname||'.'||s.relname, 'serial_ref', pg_get_serial_sequence(quote_ident(p_schema)||'.'||quote_ident(p_table), a.attname)))
  INTO seqs
  FROM pg_class c
  JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
  JOIN pg_depend d   ON d.refobjid=c.oid AND d.refobjsubid=a.attnum AND d.deptype='a'
  JOIN pg_class s    ON s.oid=d.objid AND s.relkind='S'
  JOIN pg_namespace n ON n.oid = s.relnamespace
  WHERE c.oid=rel;

  -- identities removed: the RPC no longer returns the 'identities' array to keep
  -- the payload smaller and avoid client-side handling differences across PG versions.

  -- Collation e generated
  SELECT jsonb_agg(jsonb_build_object(
    'column', column_name, 'collation', collation_name,
    'is_generated', is_generated, 'generation', generation_expression
  ))
  INTO collgen
  FROM information_schema.columns
  WHERE table_schema=p_schema AND table_name=p_table;

  -- Rules: use pg_rewrite to obtain rule OIDs (pg_rules view lacks oid).
  -- Different Postgres versions expose different column names in pg_rewrite
  -- (ev_rulename vs rulename). Use dynamic SQL to try the common variants
  -- and fall back on undefined_column without failing the whole function.
  BEGIN
    EXECUTE format($sql$
      SELECT jsonb_agg(jsonb_build_object('name', r.rulename, 'def', pg_get_ruledef(pr.oid, true)))
      FROM pg_rules r
      JOIN pg_rewrite pr ON pr.ev_class = %s::oid AND pr.ev_rulename = r.rulename
      WHERE r.schemaname = %L AND r.tablename = %L
    $sql$, rel::text, p_schema, p_table)
    INTO rules;
  EXCEPTION WHEN undefined_column THEN
    -- Try alternative column name in pg_rewrite
    BEGIN
      EXECUTE format($sql$
        SELECT jsonb_agg(jsonb_build_object('name', r.rulename, 'def', pg_get_ruledef(pr.oid, true)))
        FROM pg_rules r
        JOIN pg_rewrite pr ON pr.ev_class = %s::oid AND pr.rulename = r.rulename
        WHERE r.schemaname = %L AND r.tablename = %L
      $sql$, rel::text, p_schema, p_table)
      INTO rules;
    EXCEPTION WHEN undefined_column THEN
      -- As a last resort, return empty array (no rules found / unsupported)
      rules := '[]'::jsonb;
    END;
  END;

  -- Dependents (ex.: views)
  SELECT jsonb_agg(jsonb_build_object('dependent', d.objid::regclass::text, 'kind', c.relkind))
  INTO depends
  FROM pg_depend d
  JOIN pg_class  c ON c.oid=d.objid
  WHERE d.refobjid=rel AND d.deptype IN ('n','a');

  -- Extension
  SELECT jsonb_agg(e.extname) INTO ext
  FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
  WHERE d.objid=rel AND d.deptype='e';

  RETURN jsonb_build_object(
    'columns',      COALESCE(cols, '[]'::jsonb),
    'constraints',  COALESCE(cons, '[]'::jsonb),
    'primary_key',  COALESCE(pk_cols, '[]'::jsonb),
    'indexes',      COALESCE(idxs, '[]'::jsonb),
    'owner_acl',    COALESCE(owner_acl, '{}'::jsonb),
    'comments',     COALESCE(comments, '[]'::jsonb),
    'triggers',     COALESCE(triggers, '[]'::jsonb),
    'rls',          COALESCE(rls, '{}'::jsonb),
    'policies',     COALESCE(policies, '[]'::jsonb),
    'partitioning', COALESCE(part, '{}'::jsonb),
    'inherits',     COALESCE(inherits, '[]'::jsonb),
    'replica',      COALESCE(repl, '{}'::jsonb),
    'sizes',        COALESCE(sizes, '{}'::jsonb),
    'stats',        COALESCE(stats, '{}'::jsonb),
  'sequences',    COALESCE(seqs, '[]'::jsonb),
    'collation_gen',COALESCE(collgen, '[]'::jsonb),
    'rules',        COALESCE(rules, '[]'::jsonb),
    'dependents',   COALESCE(depends, '[]'::jsonb),
    'extension',    COALESCE(ext, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.describe_table_plus(text,text)
IS 'Retorna JSON detalhado sobre uma tabela (owner/ACL, comments, triggers, RLS/policies, partitioning, replica identity, sizes, stats, sequences/identity, collation/generated, rules, dependents, extension) além de columns/constraints/indexes.';
