-- Ajuste de policies RLS para permitir gerenciamento de catalogo de loja em ambiente de prototipo.
-- IMPORTANTE: esta versao permite escrita para qualquer usuario autenticado.
-- Para producao, troque por policy restrita a papel admin.

ALTER TABLE public."shopItems" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read all shop items" ON public."shopItems";
CREATE POLICY "Authenticated can read all shop items"
  ON public."shopItems"
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert shop items" ON public."shopItems";
CREATE POLICY "Authenticated can insert shop items"
  ON public."shopItems"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update shop items" ON public."shopItems";
CREATE POLICY "Authenticated can update shop items"
  ON public."shopItems"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete shop items" ON public."shopItems";
CREATE POLICY "Authenticated can delete shop items"
  ON public."shopItems"
  FOR DELETE
  TO authenticated
  USING (true);
