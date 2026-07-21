BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END;
$$;

ALTER FUNCTION public.obtener_metricas_soporte(date, date)
  RENAME TO obtener_metricas_soporte_interno;

REVOKE ALL ON FUNCTION public.obtener_metricas_soporte_interno(date, date)
FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.obtener_metricas_soporte_interno(date, date)
TO service_role;

CREATE FUNCTION public.obtener_metricas_soporte(
  p_desde date,
  p_hasta date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_administrador() THEN
    RAISE EXCEPTION 'No tiene permiso para consultar métricas';
  END IF;

  RETURN public.obtener_metricas_soporte_interno(p_desde, p_hasta);
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_metricas_soporte(date, date)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_metricas_soporte(date, date)
TO authenticated;
GRANT ALL ON FUNCTION public.obtener_metricas_soporte(date, date)
TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
