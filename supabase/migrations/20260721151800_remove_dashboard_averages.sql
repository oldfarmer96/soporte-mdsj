BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_metricas_soporte_base(
  p_desde date,
  p_hasta date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  limite_desde timestamptz;
  limite_hasta timestamptz;
  resultado jsonb;
BEGIN
  IF NOT public.es_personal_apoyo() THEN
    RAISE EXCEPTION 'No tiene permiso para consultar métricas';
  END IF;

  IF p_desde IS NULL
     OR p_hasta IS NULL
     OR p_desde > p_hasta THEN
    RAISE EXCEPTION 'El rango de fechas no es válido';
  END IF;

  IF p_hasta - p_desde > 365 THEN
    RAISE EXCEPTION 'El rango máximo permitido es de 366 días';
  END IF;

  limite_desde := p_desde::timestamp AT TIME ZONE 'America/Lima';
  limite_hasta := (p_hasta + 1)::timestamp AT TIME ZONE 'America/Lima';

  WITH
  tickets_periodo AS MATERIALIZED (
    SELECT
      id,
      estado,
      prioridad,
      id_area,
      id_categoria,
      created_at
    FROM public.tickets
    WHERE created_at >= limite_desde
      AND created_at < limite_hasta
  ),
  resueltos_periodo AS MATERIALIZED (
    SELECT id, resolved_at
    FROM public.tickets
    WHERE resolved_at >= limite_desde
      AND resolved_at < limite_hasta
  ),
  dias AS (
    SELECT generate_series(
      p_desde::timestamp,
      p_hasta::timestamp,
      interval '1 day'
    )::date AS dia
  ),
  creados_diarios AS (
    SELECT
      (created_at AT TIME ZONE 'America/Lima')::date AS dia,
      count(*) AS total
    FROM tickets_periodo
    GROUP BY 1
  ),
  resueltos_diarios AS (
    SELECT
      (resolved_at AT TIME ZONE 'America/Lima')::date AS dia,
      count(*) AS total
    FROM resueltos_periodo
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'from', p_desde,
      'to', p_hasta,
      'timezone', 'America/Lima'
    ),
    'summary', jsonb_build_object(
      'created', (SELECT count(*) FROM tickets_periodo),
      'resolved', (SELECT count(*) FROM resueltos_periodo),
      'active', (
        SELECT count(*)
        FROM public.tickets
        WHERE estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
      ),
      'unassigned', (
        SELECT count(*)
        FROM public.tickets
        WHERE asignado_a IS NULL
          AND estado IN ('NUEVO', 'REABIERTO')
      )
    ),
    'byStatus', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('key', estado::text, 'count', total)
        ORDER BY estado
      )
      FROM (
        SELECT estado, count(*) AS total
        FROM tickets_periodo
        GROUP BY estado
      ) datos
    ), '[]'::jsonb),
    'byPriority', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('key', prioridad::text, 'count', total)
        ORDER BY prioridad DESC
      )
      FROM (
        SELECT prioridad, count(*) AS total
        FROM tickets_periodo
        GROUP BY prioridad
      ) datos
    ), '[]'::jsonb),
    'byArea', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('key', nombre, 'count', total)
        ORDER BY total DESC, nombre
      )
      FROM (
        SELECT area.nombre, count(*) AS total
        FROM tickets_periodo ticket
        JOIN public.areas area ON area.id = ticket.id_area
        GROUP BY area.id, area.nombre
        ORDER BY total DESC, area.nombre
        LIMIT 8
      ) datos
    ), '[]'::jsonb),
    'byCategory', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('key', nombre, 'count', total)
        ORDER BY total DESC, nombre
      )
      FROM (
        SELECT categoria.nombre, count(*) AS total
        FROM tickets_periodo ticket
        JOIN public.categorias categoria ON categoria.id = ticket.id_categoria
        GROUP BY categoria.id, categoria.nombre
        ORDER BY total DESC, categoria.nombre
        LIMIT 8
      ) datos
    ), '[]'::jsonb),
    'workload', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'agent', nombre_agente,
          'assigned', asignados,
          'inProgress', en_curso
        )
        ORDER BY asignados DESC, nombre_agente
      )
      FROM (
        SELECT
          coalesce(
            nullif(trim(concat_ws(' ', perfil.nombres, perfil.apellidos)), ''),
            perfil.dni
          ) AS nombre_agente,
          count(*) AS asignados,
          count(*) FILTER (WHERE ticket.estado = 'EN_CURSO') AS en_curso
        FROM public.tickets ticket
        JOIN public.perfiles perfil ON perfil.id = ticket.asignado_a
        WHERE ticket.estado IN ('ASIGNADO', 'EN_CURSO', 'REABIERTO')
        GROUP BY perfil.id, perfil.dni, perfil.nombres, perfil.apellidos
      ) datos
    ), '[]'::jsonb),
    'daily', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', dias.dia,
          'created', coalesce(creados_diarios.total, 0),
          'resolved', coalesce(resueltos_diarios.total, 0)
        )
        ORDER BY dias.dia
      )
      FROM dias
      LEFT JOIN creados_diarios USING (dia)
      LEFT JOIN resueltos_diarios USING (dia)
    ), '[]'::jsonb)
  ) INTO resultado;

  RETURN resultado;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
