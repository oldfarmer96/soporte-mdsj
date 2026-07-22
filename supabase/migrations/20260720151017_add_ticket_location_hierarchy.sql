BEGIN;

ALTER TABLE public.areas
  ADD COLUMN es_otro boolean NOT NULL DEFAULT false;

ALTER TABLE public.categorias
  ADD COLUMN es_otro boolean NOT NULL DEFAULT false;

ALTER TABLE public.ticket_tipos_problemas
  ADD COLUMN es_otro boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX areas_solo_un_otro_idx
  ON public.areas (es_otro)
  WHERE es_otro = true;

CREATE UNIQUE INDEX categorias_solo_un_otro_idx
  ON public.categorias (es_otro)
  WHERE es_otro = true;

CREATE UNIQUE INDEX tipos_problemas_solo_un_otro_categoria_idx
  ON public.ticket_tipos_problemas (id_categoria)
  WHERE es_otro = true;

ALTER TABLE public.ticket_tipos_problemas
  ADD CONSTRAINT tipos_problemas_categoria_id_unique
  UNIQUE (id_categoria, id);

CREATE TABLE public.subareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_area uuid NOT NULL,
  nombre varchar(150) NOT NULL,
  nombre_corto varchar(30),
  descripcion varchar(300),
  es_otro boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subareas_area_fkey
    FOREIGN KEY (id_area)
    REFERENCES public.areas(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,

  CONSTRAINT subareas_nombre_area_unique
    UNIQUE (id_area, nombre),

  CONSTRAINT subareas_area_id_unique
    UNIQUE (id_area, id),

  CONSTRAINT subareas_nombre_longitud
    CHECK (char_length(trim(nombre)) BETWEEN 2 AND 150)
);

CREATE UNIQUE INDEX subareas_solo_un_otro_area_idx
  ON public.subareas (id_area)
  WHERE es_otro = true;

CREATE INDEX idx_subareas_selector
  ON public.subareas (id_area, activo, nombre);

CREATE TRIGGER trg_subareas_updated_at
BEFORE UPDATE ON public.subareas
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_updated_at();

ALTER TABLE public.tickets
  ADD COLUMN id_subarea uuid NOT NULL,
  ALTER COLUMN id_tipo_problema SET NOT NULL,
  ALTER COLUMN descripcion DROP NOT NULL;

ALTER TABLE public.tickets
  DROP CONSTRAINT tickets_id_tipo_problema_fkey;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_area_subarea_fk
    FOREIGN KEY (id_area, id_subarea)
    REFERENCES public.subareas (id_area, id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,

  ADD CONSTRAINT tickets_categoria_tipo_problema_fk
    FOREIGN KEY (id_categoria, id_tipo_problema)
    REFERENCES public.ticket_tipos_problemas (id_categoria, id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT;

CREATE INDEX idx_tickets_area_subarea
  ON public.tickets (id_area, id_subarea, created_at DESC);

CREATE INDEX idx_tickets_categoria_tipo_problema
  ON public.tickets (id_categoria, id_tipo_problema, created_at DESC);

CREATE OR REPLACE FUNCTION public.es_perfil_activo()
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
  );
$$;

CREATE OR REPLACE FUNCTION public.es_propietario_ticket(ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.es_perfil_activo()
    AND EXISTS (
      SELECT 1
      FROM public.tickets
      WHERE id = ticket_id
        AND id_solicitante = (SELECT auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.preparar_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  area_activa boolean;
  subarea_area uuid;
  subarea_activa boolean;
  categoria_activa boolean;
  categoria_critica boolean;
  categoria_es_otro boolean;
  tipo_categoria uuid;
  tipo_activo boolean;
  tipo_es_otro boolean;
  tipo_nombre varchar(150);
  tipo_prioridad public.prioridad_ticket;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Debe iniciar sesión';
  END IF;

  NEW.id_solicitante := (SELECT auth.uid());
  NEW.asignado_a := NULL;
  NEW.estado := 'NUEVO';
  NEW.assigned_at := NULL;
  NEW.started_at := NULL;
  NEW.resolved_at := NULL;
  NEW.closed_at := NULL;

  IF NOT public.es_perfil_activo() THEN
    RAISE EXCEPTION 'El solicitante no está activo';
  END IF;

  SELECT area.activo
  INTO area_activa
  FROM public.areas area
  WHERE area.id = NEW.id_area;

  IF NOT FOUND OR NOT area_activa THEN
    RAISE EXCEPTION 'El área seleccionada no está disponible';
  END IF;

  SELECT subarea.id_area, subarea.activo
  INTO subarea_area, subarea_activa
  FROM public.subareas subarea
  WHERE subarea.id = NEW.id_subarea;

  IF NOT FOUND OR NOT subarea_activa THEN
    RAISE EXCEPTION 'La subárea seleccionada no está disponible';
  END IF;

  IF subarea_area <> NEW.id_area THEN
    RAISE EXCEPTION 'La subárea no pertenece al área seleccionada';
  END IF;

  SELECT categoria.activo, categoria.es_critico, categoria.es_otro
  INTO categoria_activa, categoria_critica, categoria_es_otro
  FROM public.categorias categoria
  WHERE categoria.id = NEW.id_categoria;

  IF NOT FOUND OR NOT categoria_activa THEN
    RAISE EXCEPTION 'La categoría seleccionada no está disponible';
  END IF;

  SELECT
    tipo.id_categoria,
    tipo.activo,
    tipo.es_otro,
    tipo.nombre,
    tipo.prioridad
  INTO
    tipo_categoria,
    tipo_activo,
    tipo_es_otro,
    tipo_nombre,
    tipo_prioridad
  FROM public.ticket_tipos_problemas tipo
  WHERE tipo.id = NEW.id_tipo_problema;

  IF NOT FOUND OR NOT tipo_activo THEN
    RAISE EXCEPTION 'El tipo de problema no está disponible';
  END IF;

  IF tipo_categoria <> NEW.id_categoria THEN
    RAISE EXCEPTION 'El tipo de problema no pertenece a la categoría seleccionada';
  END IF;

  NEW.descripcion := nullif(trim(NEW.descripcion), '');

  IF (categoria_es_otro OR tipo_es_otro)
     AND (NEW.descripcion IS NULL OR char_length(NEW.descripcion) < 5) THEN
    RAISE EXCEPTION 'Debe describir el problema cuando selecciona una opción Otro';
  END IF;

  NEW.codigo := public.generar_codigo_ticket();
  NEW.asunto := trim(tipo_nombre);

  IF categoria_critica OR tipo_prioridad = 'CRITICO' THEN
    NEW.prioridad := 'CRITICO';
  ELSIF NEW.impacto = 'SERVICIO_INTERRUMPIDO' THEN
    NEW.prioridad := 'CRITICO';
  ELSIF NEW.trabajo_detenido OR NEW.impacto = 'TODA_EL_AREA' THEN
    NEW.prioridad := 'ALTO';
  ELSIF tipo_prioridad IS NOT NULL THEN
    NEW.prioridad := tipo_prioridad;
  ELSIF NEW.impacto = 'USUARIOS_MULTIPLES' THEN
    NEW.prioridad := 'MEDIO';
  ELSE
    NEW.prioridad := 'BAJO';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY usuarios_ver_areas ON public.areas;
CREATE POLICY usuarios_ver_areas
ON public.areas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_apoyo()
);

DROP POLICY usuarios_ver_categorias ON public.categorias;
CREATE POLICY usuarios_ver_categorias
ON public.categorias
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_apoyo()
);

DROP POLICY usuarios_ver_tipos_problemas ON public.ticket_tipos_problemas;
CREATE POLICY usuarios_ver_tipos_problemas
ON public.ticket_tipos_problemas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_apoyo()
);

ALTER TABLE public.subareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_ver_subareas
ON public.subareas
FOR SELECT
TO authenticated
USING (
  (activo AND public.es_perfil_activo())
  OR public.es_personal_apoyo()
);

CREATE POLICY administrador_crear_subareas
ON public.subareas
FOR INSERT
TO authenticated
WITH CHECK (public.es_administrador());

CREATE POLICY administrador_actualizar_subareas
ON public.subareas
FOR UPDATE
TO authenticated
USING (public.es_administrador())
WITH CHECK (public.es_administrador());

DROP POLICY perfil_ver_propio ON public.perfiles;
DROP POLICY apoyo_ver_perfiles ON public.perfiles;
CREATE POLICY usuarios_ver_perfiles
ON public.perfiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.es_personal_apoyo()
);

DROP POLICY solicitante_ver_archivos_propios ON public.ticket_archivos;
DROP POLICY apoyo_ver_archivos ON public.ticket_archivos;
CREATE POLICY usuarios_ver_archivos
ON public.ticket_archivos
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_personal_apoyo()
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
    OR public.es_personal_apoyo()
  )
);

DROP POLICY solicitante_ver_historial_propio ON public.ticket_historial;
DROP POLICY apoyo_ver_historial ON public.ticket_historial;
CREATE POLICY usuarios_ver_historial
ON public.ticket_historial
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_personal_apoyo()
);

DROP POLICY solicitante_ver_resolucion_propia ON public.ticket_resoluciones;
DROP POLICY apoyo_ver_resoluciones ON public.ticket_resoluciones;
CREATE POLICY usuarios_ver_resoluciones
ON public.ticket_resoluciones
FOR SELECT
TO authenticated
USING (
  public.es_propietario_ticket(id_ticket)
  OR public.es_personal_apoyo()
);

DROP POLICY solicitante_ver_sus_tickets ON public.tickets;
DROP POLICY apoyo_ver_todos_tickets ON public.tickets;
CREATE POLICY usuarios_ver_tickets
ON public.tickets
FOR SELECT
TO authenticated
USING (
  (
    id_solicitante = (SELECT auth.uid())
    AND public.es_perfil_activo()
  )
  OR public.es_personal_apoyo()
);

DROP POLICY solicitante_crear_ticket ON public.tickets;
CREATE POLICY solicitante_crear_ticket
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
  id_solicitante = (SELECT auth.uid())
  AND public.es_perfil_activo()
);

REVOKE ALL ON public.subareas FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.subareas TO authenticated;
GRANT ALL ON public.subareas TO service_role;

REVOKE ALL ON FUNCTION public.es_perfil_activo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.es_propietario_ticket(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.preparar_ticket() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.es_perfil_activo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_propietario_ticket(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.es_perfil_activo() TO service_role;
GRANT ALL ON FUNCTION public.es_propietario_ticket(uuid) TO service_role;
GRANT ALL ON FUNCTION public.preparar_ticket() TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
