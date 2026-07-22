BEGIN;

CREATE OR REPLACE FUNCTION public.es_apoyo_operativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = (SELECT auth.uid())
      AND estado = 'ACTIVO'
      AND rol = 'APOYO'
  );
$$;

CREATE OR REPLACE FUNCTION public.es_personal_interno()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = (SELECT auth.uid())
      AND estado = 'ACTIVO'
      AND rol IN ('APOYO', 'ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.es_solicitante()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = (SELECT auth.uid())
      AND estado = 'ACTIVO'
      AND rol = 'SOLICITANTE'
  );
$$;

CREATE OR REPLACE FUNCTION public.validar_asignacion_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.asignado_a IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = NEW.asignado_a
      AND estado = 'ACTIVO'
      AND rol = 'APOYO'
  ) THEN
    RAISE EXCEPTION 'El usuario asignado no pertenece al personal de apoyo activo';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.asegurar_creacion_solicitante()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_solicitante() THEN
    RAISE EXCEPTION 'Solo un solicitante activo puede crear tickets';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_asegurar_creacion_solicitante
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.asegurar_creacion_solicitante();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tickets ticket
    JOIN public.perfiles perfil ON perfil.id = ticket.asignado_a
    WHERE perfil.rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION
      'Existen tickets asignados a administradores; reasígnelos antes de aplicar esta migración';
  END IF;
END;
$$;

ALTER FUNCTION public.asignar_ticket(uuid, uuid)
  RENAME TO asignar_ticket_interno;

CREATE FUNCTION public.asignar_ticket(
  p_id_ticket uuid,
  p_id_apoyo uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_apoyo_operativo() THEN
    RAISE EXCEPTION 'No tiene permiso para asignar tickets';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = p_id_apoyo
      AND estado = 'ACTIVO'
      AND rol = 'APOYO'
  ) THEN
    RAISE EXCEPTION 'El personal seleccionado no está disponible';
  END IF;

  RETURN public.asignar_ticket_interno(p_id_ticket, p_id_apoyo);
END;
$$;

ALTER FUNCTION public.cambiar_estado_ticket(
  uuid,
  public.estado_ticket,
  character varying
)
  RENAME TO cambiar_estado_ticket_interno;

CREATE FUNCTION public.cambiar_estado_ticket(
  p_id_ticket uuid,
  p_nuevo_estado public.estado_ticket,
  p_detalle character varying DEFAULT NULL
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_apoyo_operativo() THEN
    RAISE EXCEPTION 'No tiene permiso para cambiar el estado';
  END IF;

  RETURN public.cambiar_estado_ticket_interno(
    p_id_ticket,
    p_nuevo_estado,
    p_detalle
  );
END;
$$;

ALTER FUNCTION public.resolver_ticket(uuid, text, text)
  RENAME TO resolver_ticket_interno;

CREATE FUNCTION public.resolver_ticket(
  p_id_ticket uuid,
  p_diagnostico text,
  p_solucion text
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_apoyo_operativo() THEN
    RAISE EXCEPTION 'No tiene permiso para resolver tickets';
  END IF;

  RETURN public.resolver_ticket_interno(
    p_id_ticket,
    p_diagnostico,
    p_solucion
  );
END;
$$;

ALTER FUNCTION public.reabrir_ticket(uuid, character varying)
  RENAME TO reabrir_ticket_interno;

CREATE FUNCTION public.reabrir_ticket(
  p_id_ticket uuid,
  p_motivo character varying
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    public.es_propietario_ticket(p_id_ticket)
    OR public.es_apoyo_operativo()
  ) THEN
    RAISE EXCEPTION 'No se encontró el ticket o no tiene permiso';
  END IF;

  RETURN public.reabrir_ticket_interno(p_id_ticket, p_motivo);
END;
$$;

DROP POLICY usuarios_ver_areas ON public.areas;
CREATE POLICY usuarios_ver_areas
ON public.areas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_interno()
);

DROP POLICY usuarios_ver_subareas ON public.subareas;
CREATE POLICY usuarios_ver_subareas
ON public.subareas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_interno()
);

DROP POLICY usuarios_ver_categorias ON public.categorias;
CREATE POLICY usuarios_ver_categorias
ON public.categorias
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_interno()
);

DROP POLICY usuarios_ver_tipos_problemas ON public.ticket_tipos_problemas;
CREATE POLICY usuarios_ver_tipos_problemas
ON public.ticket_tipos_problemas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_interno()
);

DROP POLICY usuarios_ver_perfiles ON public.perfiles;
CREATE POLICY usuarios_ver_perfiles
ON public.perfiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.es_personal_interno()
);

DROP POLICY usuarios_ver_tickets ON public.tickets;
CREATE POLICY usuarios_ver_tickets
ON public.tickets
FOR SELECT
TO authenticated
USING (
  (
    id_solicitante = (SELECT auth.uid())
    AND public.es_solicitante()
  )
  OR public.es_apoyo_operativo()
);

DROP POLICY solicitante_crear_ticket ON public.tickets;
CREATE POLICY solicitante_crear_ticket
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
  id_solicitante = (SELECT auth.uid())
  AND public.es_solicitante()
);

DROP POLICY usuarios_ver_archivos ON public.ticket_archivos;
CREATE POLICY usuarios_ver_archivos
ON public.ticket_archivos
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_apoyo_operativo()
);

DROP POLICY usuarios_registrar_archivos ON public.ticket_archivos;
CREATE POLICY usuarios_registrar_archivos
ON public.ticket_archivos
FOR INSERT
TO authenticated
WITH CHECK (
  subido_por = (SELECT auth.uid())
  AND (
    public.es_propietario_ticket(id_ticket)
    OR public.es_apoyo_operativo()
  )
);

DROP POLICY usuarios_ver_historial ON public.ticket_historial;
CREATE POLICY usuarios_ver_historial
ON public.ticket_historial
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_apoyo_operativo()
);

DROP POLICY usuarios_ver_resoluciones ON public.ticket_resoluciones;
CREATE POLICY usuarios_ver_resoluciones
ON public.ticket_resoluciones
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_apoyo_operativo()
);

DROP POLICY subir_archivo_ticket_propio ON storage.objects;
CREATE POLICY subir_archivo_ticket_propio
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-archivos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (
    public.es_propietario_ticket(
      ((storage.foldername(name))[2])::uuid
    )
    OR public.es_apoyo_operativo()
  )
);

DROP POLICY ver_archivo_ticket_propio ON storage.objects;
CREATE POLICY ver_archivo_ticket_propio
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND (
    public.es_propietario_ticket(
      ((storage.foldername(name))[2])::uuid
    )
    OR public.es_apoyo_operativo()
  )
);

DROP POLICY limpiar_subida_archivo_propia ON storage.objects;
CREATE POLICY limpiar_subida_archivo_propia
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND owner_id = (SELECT auth.uid())::text
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND (
    public.es_propietario_ticket(
      ((storage.foldername(name))[2])::uuid
    )
    OR public.es_apoyo_operativo()
  )
);

CREATE TABLE public.perfil_acceso_historial (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_perfil uuid NOT NULL
    REFERENCES public.perfiles(id)
    ON DELETE CASCADE,
  realizado_por uuid
    REFERENCES public.perfiles(id)
    ON DELETE SET NULL,
  rol_anterior public.user_role NOT NULL,
  rol_nuevo public.user_role NOT NULL,
  estado_anterior public.estado_perfil NOT NULL,
  estado_nuevo public.estado_perfil NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_perfil_acceso_historial_perfil
  ON public.perfil_acceso_historial (id_perfil, created_at DESC);

ALTER TABLE public.perfil_acceso_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY administrador_ver_historial_acceso
ON public.perfil_acceso_historial
FOR SELECT
TO authenticated
USING (public.es_administrador());

DROP POLICY administrador_actualizar_perfiles ON public.perfiles;
REVOKE UPDATE ON public.perfiles FROM authenticated;

CREATE FUNCTION public.actualizar_acceso_perfil(
  p_id_perfil uuid,
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

  IF p_id_perfil = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'No puede modificar su propia cuenta administrativa';
  END IF;

  SELECT *
  INTO perfil_actual
  FROM public.perfiles
  WHERE id = p_id_perfil
  FOR UPDATE;

  IF perfil_actual.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil';
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
  SET rol = p_rol, estado = p_estado
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

REVOKE ALL ON public.perfil_acceso_historial FROM anon, authenticated;
GRANT SELECT ON public.perfil_acceso_historial TO authenticated;
GRANT ALL ON public.perfil_acceso_historial TO service_role;

REVOKE ALL ON FUNCTION public.es_apoyo_operativo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.es_personal_interno() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.es_solicitante() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.asegurar_creacion_solicitante() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.es_personal_apoyo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.asignar_ticket_interno(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cambiar_estado_ticket_interno(uuid, public.estado_ticket, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolver_ticket_interno(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reabrir_ticket_interno(uuid, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actualizar_acceso_perfil(uuid, public.user_role, public.estado_perfil) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.asignar_ticket(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cambiar_estado_ticket(uuid, public.estado_ticket, character varying) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolver_ticket(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reabrir_ticket(uuid, character varying) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.es_apoyo_operativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_personal_interno() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_solicitante() TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_acceso_perfil(uuid, public.user_role, public.estado_perfil) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_ticket(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_ticket(uuid, public.estado_ticket, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_ticket(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_ticket(uuid, character varying) TO authenticated;

GRANT ALL ON FUNCTION public.es_apoyo_operativo() TO service_role;
GRANT ALL ON FUNCTION public.es_personal_interno() TO service_role;
GRANT ALL ON FUNCTION public.es_solicitante() TO service_role;
GRANT ALL ON FUNCTION public.asegurar_creacion_solicitante() TO service_role;
GRANT ALL ON FUNCTION public.asignar_ticket_interno(uuid, uuid) TO service_role;
GRANT ALL ON FUNCTION public.cambiar_estado_ticket_interno(uuid, public.estado_ticket, character varying) TO service_role;
GRANT ALL ON FUNCTION public.resolver_ticket_interno(uuid, text, text) TO service_role;
GRANT ALL ON FUNCTION public.reabrir_ticket_interno(uuid, character varying) TO service_role;
GRANT ALL ON FUNCTION public.actualizar_acceso_perfil(uuid, public.user_role, public.estado_perfil) TO service_role;
GRANT ALL ON FUNCTION public.asignar_ticket(uuid, uuid) TO service_role;
GRANT ALL ON FUNCTION public.cambiar_estado_ticket(uuid, public.estado_ticket, character varying) TO service_role;
GRANT ALL ON FUNCTION public.resolver_ticket(uuid, text, text) TO service_role;
GRANT ALL ON FUNCTION public.reabrir_ticket(uuid, character varying) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
