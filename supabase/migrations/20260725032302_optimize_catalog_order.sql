BEGIN;

ALTER TABLE public.areas
  ADD COLUMN orden integer NOT NULL DEFAULT 1000,
  ADD CONSTRAINT areas_orden_positivo CHECK (orden > 0);

ALTER TABLE public.subareas
  ADD COLUMN orden integer NOT NULL DEFAULT 1000,
  ADD COLUMN es_sin_subarea boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT subareas_orden_positivo CHECK (orden > 0),
  ADD CONSTRAINT subareas_tipo_exclusivo
    CHECK (NOT (es_sin_subarea AND es_otro));

ALTER TABLE public.categorias
  ADD COLUMN orden integer NOT NULL DEFAULT 1000,
  ADD CONSTRAINT categorias_orden_positivo CHECK (orden > 0);

ALTER TABLE public.ticket_tipos_problemas
  ADD COLUMN orden integer NOT NULL DEFAULT 1000,
  ADD CONSTRAINT ticket_tipos_problemas_orden_positivo CHECK (orden > 0);

CREATE UNIQUE INDEX areas_nombre_normalizado_unique_idx
  ON public.areas (lower(btrim(nombre)));

CREATE UNIQUE INDEX subareas_nombre_normalizado_area_unique_idx
  ON public.subareas (id_area, lower(btrim(nombre)));

CREATE UNIQUE INDEX categorias_nombre_normalizado_unique_idx
  ON public.categorias (lower(btrim(nombre)));

CREATE UNIQUE INDEX tipos_problemas_nombre_normalizado_categoria_unique_idx
  ON public.ticket_tipos_problemas (id_categoria, lower(btrim(nombre)));

CREATE UNIQUE INDEX subareas_solo_una_sin_subarea_area_idx
  ON public.subareas (id_area)
  WHERE es_sin_subarea = true;

DROP INDEX public.idx_areas_activas;
DROP INDEX public.idx_subareas_selector;
DROP INDEX public.idx_categorias_activas;
DROP INDEX public.idx_tipos_problemas_categoria;

CREATE INDEX idx_areas_selector_orden
  ON public.areas (activo, orden, nombre);

CREATE INDEX idx_subareas_selector_orden
  ON public.subareas (id_area, activo, orden, nombre);

CREATE INDEX idx_categorias_selector_orden
  ON public.categorias (activo, orden, nombre);

CREATE INDEX idx_tipos_problemas_selector_orden
  ON public.ticket_tipos_problemas (id_categoria, activo, orden, nombre);

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
  ELSIF tipo_prioridad = 'ALTO' THEN
    NEW.prioridad := 'ALTO';
  ELSIF tipo_prioridad = 'MEDIO'
     OR NEW.impacto = 'USUARIOS_MULTIPLES' THEN
    NEW.prioridad := 'MEDIO';
  ELSE
    NEW.prioridad := 'BAJO';
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
