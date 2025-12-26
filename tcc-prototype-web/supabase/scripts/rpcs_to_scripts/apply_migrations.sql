-- Cria função temporária para executar um script SQL enviado em base64.
-- AVISO: só permita chamadas com service_role. Remova a função após o uso.
CREATE OR REPLACE FUNCTION public.run_sql_script_b64(p_b64 text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_text text;
  stmt text;
  executed_count int := 0;
BEGIN
  -- decodifica base64 para texto
  sql_text := convert_from(decode(p_b64, 'base64'), 'UTF8');

  -- Remover comandos de controle de transação que não podem ser EXECUTEd
  -- dentro de EXECUTE (BEGIN/COMMIT/START TRANSACTION/END TRANSACTION)
  sql_text := regexp_replace(sql_text, '(^|\n)\s*(BEGIN|COMMIT|START TRANSACTION|END TRANSACTION)\s*;?\s*(\n|$)', '\1', 'gi');

  -- Dividir por ponto e vírgula e executar cada statement individualmente.
  -- Trim e ignore statements vazias.
  FOR stmt IN SELECT trim(both FROM s) FROM unnest(string_to_array(sql_text, ';')) s
  LOOP
    IF stmt IS NULL OR stmt = '' THEN
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE stmt;
      executed_count := executed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Retornar erro com a mensagem e quantos statements foram executados antes
      RETURN jsonb_build_object('status','error','message', SQLERRM, 'executed_before', executed_count, 'failed_statement', stmt);
    END;
  END LOOP;

  RETURN jsonb_build_object('status','ok','message','executado com sucesso','executed', executed_count);
END;
$$;

COMMENT ON FUNCTION public.run_sql_script_b64(text)
IS 'Executa script SQL recebido como base64. Use com service_role. Apagar após uso.';