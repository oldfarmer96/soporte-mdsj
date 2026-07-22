BEGIN;

CREATE INDEX idx_tickets_created_at_id
ON public.tickets (created_at DESC, id DESC);

CREATE FUNCTION public.obtener_detalle_reporte_soporte(
  p_desde date,
  p_hasta date
)
RETURNS TABLE (
  codigo text,
  created_at timestamptz,
  updated_at timestamptz,
  solicitante text,
  solicitante_dni text,
  area text,
  subarea text,
  categoria text,
  tipo_problema text,
  asunto text,
  descripcion text,
  impacto text,
  trabajo_detenido boolean,
  prioridad text,
  estado text,
  asignado text,
  assigned_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  limite_desde timestamptz;
  limite_hasta timestamptz;
BEGIN
  IF NOT public.es_administrador() THEN
    RAISE EXCEPTION 'No tiene permiso para exportar tickets';
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

  RETURN QUERY
  SELECT
    ticket.codigo::text,
    ticket.created_at,
    ticket.updated_at,
    coalesce(
      nullif(trim(concat_ws(' ', solicitante.nombres, solicitante.apellidos)), ''),
      solicitante.dni
    )::text,
    solicitante.dni::text,
    area.nombre::text,
    subarea.nombre::text,
    categoria.nombre::text,
    tipo.nombre::text,
    ticket.asunto::text,
    ticket.descripcion,
    ticket.impacto::text,
    ticket.trabajo_detenido,
    ticket.prioridad::text,
    ticket.estado::text,
    CASE
      WHEN asignado.id IS NULL THEN NULL
      ELSE coalesce(
        nullif(trim(concat_ws(' ', asignado.nombres, asignado.apellidos)), ''),
        asignado.dni
      )
    END::text,
    ticket.assigned_at,
    ticket.started_at,
    ticket.resolved_at,
    ticket.closed_at
  FROM public.tickets ticket
  JOIN public.perfiles solicitante ON solicitante.id = ticket.id_solicitante
  JOIN public.areas area ON area.id = ticket.id_area
  JOIN public.subareas subarea ON subarea.id = ticket.id_subarea
  JOIN public.categorias categoria ON categoria.id = ticket.id_categoria
  LEFT JOIN public.ticket_tipos_problemas tipo ON tipo.id = ticket.id_tipo_problema
  LEFT JOIN public.perfiles asignado ON asignado.id = ticket.asignado_a
  WHERE ticket.created_at >= limite_desde
    AND ticket.created_at < limite_hasta
  ORDER BY ticket.created_at DESC, ticket.id DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_detalle_reporte_soporte(date, date)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_detalle_reporte_soporte(date, date)
TO authenticated;
GRANT ALL ON FUNCTION public.obtener_detalle_reporte_soporte(date, date)
TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
