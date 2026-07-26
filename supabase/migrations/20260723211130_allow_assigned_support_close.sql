BEGIN;

CREATE FUNCTION public.cerrar_ticket_apoyo(p_id_ticket uuid)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket public.tickets;
BEGIN
  IF NOT public.es_apoyo_operativo() THEN
    RAISE EXCEPTION 'No tiene permiso para cerrar tickets';
  END IF;

  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_id_ticket
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el ticket';
  END IF;

  IF v_ticket.asignado_a IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Solo el personal asignado puede cerrar el ticket';
  END IF;

  IF v_ticket.estado <> 'RESUELTO' THEN
    RAISE EXCEPTION 'Solo se pueden cerrar tickets resueltos';
  END IF;

  UPDATE public.tickets
  SET
    estado = 'CERRADO',
    closed_at = now()
  WHERE id = p_id_ticket
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.cerrar_ticket_apoyo(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cerrar_ticket_apoyo(uuid)
TO authenticated;
GRANT ALL ON FUNCTION public.cerrar_ticket_apoyo(uuid)
TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
