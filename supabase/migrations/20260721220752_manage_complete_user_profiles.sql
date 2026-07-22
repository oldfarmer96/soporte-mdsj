BEGIN;

CREATE FUNCTION public.actualizar_perfil_administrador(
  p_id_perfil uuid,
  p_nombres character varying,
  p_apellidos character varying,
  p_telefono character varying,
  p_rol public.user_role,
  p_estado public.estado_perfil
)
RETURNS public.perfiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  perfil_actual public.perfiles;
  resultado public.perfiles;
BEGIN
  IF NOT public.es_administrador() THEN
    RAISE EXCEPTION 'No tiene permiso para administrar usuarios';
  END IF;

  -- Serializa cambios de acceso para proteger al ultimo administrador activo.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('administrar-acceso-perfiles', 0)
  );

  SELECT *
  INTO perfil_actual
  FROM public.perfiles
  WHERE id = p_id_perfil
  FOR UPDATE;

  IF perfil_actual.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil';
  END IF;

  IF p_id_perfil = (SELECT auth.uid())
     AND (
       perfil_actual.rol IS DISTINCT FROM p_rol
       OR perfil_actual.estado IS DISTINCT FROM p_estado
     ) THEN
    RAISE EXCEPTION 'No puede modificar el acceso de su propia cuenta administrativa';
  END IF;

  IF perfil_actual.rol = 'ADMIN'
     AND perfil_actual.estado = 'ACTIVO'
     AND (p_rol <> 'ADMIN' OR p_estado <> 'ACTIVO')
     AND NOT EXISTS (
       SELECT 1
       FROM public.perfiles
       WHERE id <> p_id_perfil
         AND rol = 'ADMIN'
         AND estado = 'ACTIVO'
     ) THEN
    RAISE EXCEPTION 'No puede deshabilitar al último administrador activo';
  END IF;

  IF perfil_actual.rol = 'APOYO'
     AND (p_rol <> 'APOYO' OR p_estado <> 'ACTIVO')
     AND EXISTS (
       SELECT 1
       FROM public.tickets
       WHERE asignado_a = p_id_perfil
         AND estado NOT IN ('RESUELTO', 'CERRADO', 'CANCELADO')
     ) THEN
    RAISE EXCEPTION
      'El usuario tiene tickets activos asignados; reasígnelos antes de cambiar su acceso';
  END IF;

  UPDATE public.perfiles
  SET nombres = nullif(pg_catalog.btrim(p_nombres), ''),
      apellidos = nullif(pg_catalog.btrim(p_apellidos), ''),
      telefono = nullif(pg_catalog.btrim(p_telefono), ''),
      rol = p_rol,
      estado = p_estado
  WHERE id = p_id_perfil
  RETURNING * INTO resultado;

  IF perfil_actual.rol IS DISTINCT FROM p_rol
     OR perfil_actual.estado IS DISTINCT FROM p_estado THEN
    INSERT INTO public.perfil_acceso_historial (
      id_perfil,
      realizado_por,
      rol_anterior,
      rol_nuevo,
      estado_anterior,
      estado_nuevo
    ) VALUES (
      p_id_perfil,
      (SELECT auth.uid()),
      perfil_actual.rol,
      p_rol,
      perfil_actual.estado,
      p_estado
    );
  END IF;

  RETURN resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_perfil_administrador(
  uuid,
  character varying,
  character varying,
  character varying,
  public.user_role,
  public.estado_perfil
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.actualizar_perfil_administrador(
  uuid,
  character varying,
  character varying,
  character varying,
  public.user_role,
  public.estado_perfil
) TO authenticated;

GRANT ALL ON FUNCTION public.actualizar_perfil_administrador(
  uuid,
  character varying,
  character varying,
  character varying,
  public.user_role,
  public.estado_perfil
) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
