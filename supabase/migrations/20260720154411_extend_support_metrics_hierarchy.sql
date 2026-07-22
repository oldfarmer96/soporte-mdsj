ALTER FUNCTION public.obtener_metricas_soporte(date, date)
  RENAME TO obtener_metricas_soporte_base;

REVOKE ALL ON FUNCTION public.obtener_metricas_soporte_base(date, date)
FROM PUBLIC, anon, authenticated;

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
DECLARE
  limite_desde timestamptz;
  limite_hasta timestamptz;
  resultado jsonb;
  por_subarea jsonb;
  por_tipo jsonb;
BEGIN
  IF NOT public.es_personal_apoyo() THEN
    RAISE EXCEPTION 'No tiene permiso para consultar métricas';
  END IF;

  resultado := public.obtener_metricas_soporte_base(p_desde, p_hasta);
  limite_desde := p_desde::timestamp AT TIME ZONE 'America/Lima';
  limite_hasta := (p_hasta + 1)::timestamp AT TIME ZONE 'America/Lima';

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('key', nombre, 'count', total)
      ORDER BY total DESC, nombre
    ),
    '[]'::jsonb
  )
  INTO por_subarea
  FROM (
    SELECT subarea.nombre, count(*) AS total
    FROM public.tickets ticket
    JOIN public.subareas subarea ON subarea.id = ticket.id_subarea
    WHERE ticket.created_at >= limite_desde
      AND ticket.created_at < limite_hasta
    GROUP BY subarea.id, subarea.nombre
    ORDER BY total DESC, subarea.nombre
    LIMIT 8
  ) datos;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('key', nombre, 'count', total)
      ORDER BY total DESC, nombre
    ),
    '[]'::jsonb
  )
  INTO por_tipo
  FROM (
    SELECT tipo.nombre, count(*) AS total
    FROM public.tickets ticket
    JOIN public.ticket_tipos_problemas tipo
      ON tipo.id = ticket.id_tipo_problema
    WHERE ticket.created_at >= limite_desde
      AND ticket.created_at < limite_hasta
    GROUP BY tipo.id, tipo.nombre
    ORDER BY total DESC, tipo.nombre
    LIMIT 8
  ) datos;

  RETURN resultado || jsonb_build_object(
    'bySubarea', por_subarea,
    'byProblemType', por_tipo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_metricas_soporte(date, date)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_metricas_soporte(date, date)
TO authenticated;
GRANT ALL ON FUNCTION public.obtener_metricas_soporte(date, date)
TO service_role;
GRANT ALL ON FUNCTION public.obtener_metricas_soporte_base(date, date)
TO service_role;

NOTIFY pgrst, 'reload schema';
