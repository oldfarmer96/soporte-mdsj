SET check_function_bodies = false;
CREATE TYPE public.estado_perfil AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');
CREATE TYPE public.estado_ticket AS ENUM ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'RESUELTO', 'CERRADO', 'CANCELADO', 'REABIERTO');
CREATE TYPE public.nivel_impacto AS ENUM ('INDIVIDUAL', 'USUARIOS_MULTIPLES', 'TODA_EL_AREA', 'SERVICIO_INTERRUMPIDO');
CREATE TYPE public.prioridad_ticket AS ENUM ('BAJO', 'MEDIO', 'ALTO', 'CRITICO');
CREATE TYPE public.tipo_evento_ticket AS ENUM ('CREACION', 'ASIGNACION', 'REASIGNACION', 'CAMBIO_ESTADO', 'CAMBIO_PRIORIDAD', 'RESOLUCION', 'CIERRE', 'REAPERTURA', 'COMENTARIO');
CREATE TYPE public.user_role AS ENUM ('SOLICITANTE', 'APOYO', 'ADMIN');
CREATE SEQUENCE public.ticket_codigo_seq CACHE 10;
GRANT UPDATE ON SEQUENCE public.ticket_codigo_seq TO anon;
GRANT UPDATE ON SEQUENCE public.ticket_codigo_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.ticket_codigo_seq TO service_role;
CREATE FUNCTION public.actualizar_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
CREATE FUNCTION public.crear_perfil_nuevo_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  nuevo_dni text;
begin
  nuevo_dni := new.raw_user_meta_data ->> 'dni';

  if nuevo_dni is null
     or nuevo_dni !~ '^[0-9]{8}$'
     or new.email <> nuevo_dni || '@mdsj.com' then
    raise exception 'Los datos de registro no son válidos';
  end if;

  insert into public.perfiles (
    id,
    dni,
    nombres,
    apellidos,
    telefono
  )
  values (
    new.id,
    nuevo_dni,
    trim(new.raw_user_meta_data ->> 'nombres'),
    trim(new.raw_user_meta_data ->> 'apellidos'),
    nullif(trim(new.raw_user_meta_data ->> 'telefono'), '')
  );

  return new;
end;
$function$;
CREATE TRIGGER trg_crear_perfil_nuevo_usuario AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.crear_perfil_nuevo_usuario();
CREATE FUNCTION public.es_administrador()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and estado = 'ACTIVO'
      and rol = 'ADMIN'
  );
$function$;
CREATE FUNCTION public.es_personal_apoyo()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and estado = 'ACTIVO'
      and rol in ('APOYO', 'ADMIN')
  );
$function$;
CREATE FUNCTION public.es_propietario_ticket(ticket_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.tickets
    where id = ticket_id
      and id_solicitante = auth.uid()
  );
$function$;
CREATE FUNCTION public.generar_codigo_ticket()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  numero bigint;
  anio text;
begin
  numero := nextval('public.ticket_codigo_seq');
  anio := extract(year from now())::integer::text;

  return
    'ST-' ||
    anio ||
    '-' ||
    lpad(numero::text, 6, '0');
end;
$function$;
CREATE FUNCTION public.obtener_metricas_soporte(p_desde date, p_hasta date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  limite_desde timestamptz;
  limite_hasta timestamptz;
  resultado jsonb;
begin
  if not public.es_personal_apoyo() then
    raise exception 'No tiene permiso para consultar métricas';
  end if;

  if p_desde is null
     or p_hasta is null
     or p_desde > p_hasta then
    raise exception 'El rango de fechas no es válido';
  end if;

  if p_hasta - p_desde > 365 then
    raise exception 'El rango máximo permitido es de 366 días';
  end if;

  limite_desde := p_desde::timestamp
    at time zone 'America/Lima';
  limite_hasta := (p_hasta + 1)::timestamp
    at time zone 'America/Lima';

  with
  tickets_periodo as materialized (
    select
      id,
      estado,
      prioridad,
      id_area,
      id_categoria,
      created_at,
      assigned_at,
      resolved_at
    from public.tickets
    where created_at >= limite_desde
      and created_at < limite_hasta
  ),
  resueltos_periodo as materialized (
    select id, resolved_at
    from public.tickets
    where resolved_at >= limite_desde
      and resolved_at < limite_hasta
  ),
  dias as (
    select generate_series(
      p_desde::timestamp,
      p_hasta::timestamp,
      interval '1 day'
    )::date as dia
  ),
  creados_diarios as (
    select
      (created_at at time zone 'America/Lima')::date as dia,
      count(*) as total
    from tickets_periodo
    group by 1
  ),
  resueltos_diarios as (
    select
      (resolved_at at time zone 'America/Lima')::date as dia,
      count(*) as total
    from resueltos_periodo
    group by 1
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'from', p_desde,
      'to', p_hasta,
      'timezone', 'America/Lima'
    ),
    'summary', jsonb_build_object(
      'created', (select count(*) from tickets_periodo),
      'resolved', (select count(*) from resueltos_periodo),
      'active', (
        select count(*)
        from public.tickets
        where estado in ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
      ),
      'unassigned', (
        select count(*)
        from public.tickets
        where asignado_a is null
          and estado in ('NUEVO', 'REABIERTO')
      ),
      'avgAssignmentHours', coalesce((
        select round(
          avg(extract(epoch from (assigned_at - created_at)) / 3600)::numeric,
          1
        )
        from tickets_periodo
        where assigned_at is not null
      ), 0),
      'avgResolutionHours', coalesce((
        select round(
          avg(extract(epoch from (resolved_at - created_at)) / 3600)::numeric,
          1
        )
        from tickets_periodo
        where resolved_at is not null
      ), 0)
    ),
    'byStatus', coalesce((
      select jsonb_agg(
        jsonb_build_object('key', estado::text, 'count', total)
        order by estado
      )
      from (
        select estado, count(*) as total
        from tickets_periodo
        group by estado
      ) datos
    ), '[]'::jsonb),
    'byPriority', coalesce((
      select jsonb_agg(
        jsonb_build_object('key', prioridad::text, 'count', total)
        order by prioridad desc
      )
      from (
        select prioridad, count(*) as total
        from tickets_periodo
        group by prioridad
      ) datos
    ), '[]'::jsonb),
    'byArea', coalesce((
      select jsonb_agg(
        jsonb_build_object('key', nombre, 'count', total)
        order by total desc, nombre
      )
      from (
        select area.nombre, count(*) as total
        from tickets_periodo ticket
        join public.areas area on area.id = ticket.id_area
        group by area.id, area.nombre
        order by total desc, area.nombre
        limit 8
      ) datos
    ), '[]'::jsonb),
    'byCategory', coalesce((
      select jsonb_agg(
        jsonb_build_object('key', nombre, 'count', total)
        order by total desc, nombre
      )
      from (
        select categoria.nombre, count(*) as total
        from tickets_periodo ticket
        join public.categorias categoria on categoria.id = ticket.id_categoria
        group by categoria.id, categoria.nombre
        order by total desc, categoria.nombre
        limit 8
      ) datos
    ), '[]'::jsonb),
    'workload', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'agent', nombres || ' ' || apellidos,
          'assigned', asignados,
          'inProgress', en_curso
        )
        order by asignados desc, nombres, apellidos
      )
      from (
        select
          perfil.nombres,
          perfil.apellidos,
          count(*) as asignados,
          count(*) filter (where ticket.estado = 'EN_CURSO') as en_curso
        from public.tickets ticket
        join public.perfiles perfil on perfil.id = ticket.asignado_a
        where ticket.estado in ('ASIGNADO', 'EN_CURSO', 'REABIERTO')
        group by perfil.id, perfil.nombres, perfil.apellidos
      ) datos
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', dias.dia,
          'created', coalesce(creados_diarios.total, 0),
          'resolved', coalesce(resueltos_diarios.total, 0)
        )
        order by dias.dia
      )
      from dias
      left join creados_diarios using (dia)
      left join resueltos_diarios using (dia)
    ), '[]'::jsonb)
  ) into resultado;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.obtener_metricas_soporte(date, date) TO authenticated;
CREATE FUNCTION public.preparar_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  categoria_tipo uuid;
  prioridad_tipo public.prioridad_ticket;
  categoria_critica boolean;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión';
  end if;

  -- Un solicitante solo puede crear tickets para sí mismo.
  if not public.es_personal_apoyo() then
    new.id_solicitante := auth.uid();
    new.asignado_a := null;
    new.estado := 'NUEVO';
    new.assigned_at := null;
    new.started_at := null;
    new.resolved_at := null;
    new.closed_at := null;
  end if;

  if not exists (
    select 1
    from public.perfiles
    where id = new.id_solicitante
      and estado = 'ACTIVO'
  ) then
    raise exception 'El solicitante no está activo';
  end if;

  if not exists (
    select 1
    from public.areas
    where id = new.id_area
      and activo = true
  ) then
    raise exception 'El área seleccionada no está disponible';
  end if;

  select es_critico
  into categoria_critica
  from public.categorias
  where id = new.id_categoria
    and activo = true;

  if categoria_critica is null then
    raise exception 'La categoría seleccionada no está disponible';
  end if;

  if new.id_tipo_problema is not null then
    select
      id_categoria,
      prioridad
    into
      categoria_tipo,
      prioridad_tipo
    from public.ticket_tipos_problemas
    where id = new.id_tipo_problema
      and activo = true;

    if categoria_tipo is null then
      raise exception 'El tipo de problema no está disponible';
    end if;

    if categoria_tipo <> new.id_categoria then
      raise exception
        'El tipo de problema no pertenece a la categoría seleccionada';
    end if;
  end if;

  new.codigo := public.generar_codigo_ticket();
  new.asunto := trim(new.asunto);
  new.descripcion := trim(new.descripcion);

  -- Prioridad automática inicial.
  if categoria_critica = true then
    new.prioridad := 'CRITICO';

  elsif new.impacto = 'SERVICIO_INTERRUMPIDO' then
    new.prioridad := 'CRITICO';

  elsif new.impacto = 'TODA_EL_AREA'
     or new.trabajo_detenido = true then
    new.prioridad := 'ALTO';

  elsif prioridad_tipo is not null then
    new.prioridad := prioridad_tipo;

  elsif new.impacto = 'USUARIOS_MULTIPLES' then
    new.prioridad := 'MEDIO';

  else
    new.prioridad := 'BAJO';
  end if;

  return new;
end;
$function$;
CREATE FUNCTION public.registrar_cambios_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  evento public.tipo_evento_ticket;
begin
  -- Cambio de estado.
  if new.estado is distinct from old.estado then

    if not public.transicion_ticket_valida(
      old.estado,
      new.estado
    ) then
      raise exception
        'No se permite cambiar el ticket de % a %',
        old.estado,
        new.estado;
    end if;

    evento := case
      when new.estado = 'RESUELTO'
        then 'RESOLUCION'::public.tipo_evento_ticket
      when new.estado = 'CERRADO'
        then 'CIERRE'::public.tipo_evento_ticket
      when new.estado = 'REABIERTO'
        then 'REAPERTURA'::public.tipo_evento_ticket
      else 'CAMBIO_ESTADO'::public.tipo_evento_ticket
    end;

    insert into public.ticket_historial (
      id_ticket,
      realizado_por,
      tipo_evento,
      estado_anterior,
      estado_nuevo,
      detalle
    )
    values (
      new.id,
      auth.uid(),
      evento,
      old.estado,
      new.estado,
      'Cambio de estado'
    );
  end if;

  -- Cambio de asignación.
  if new.asignado_a is distinct from old.asignado_a then

    evento := case
      when old.asignado_a is null
        then 'ASIGNACION'::public.tipo_evento_ticket
      else 'REASIGNACION'::public.tipo_evento_ticket
    end;

    insert into public.ticket_historial (
      id_ticket,
      realizado_por,
      tipo_evento,
      asignado_anterior,
      asignado_nuevo,
      detalle
    )
    values (
      new.id,
      auth.uid(),
      evento,
      old.asignado_a,
      new.asignado_a,
      case
        when old.asignado_a is null
          then 'Ticket asignado'
        else 'Ticket reasignado'
      end
    );
  end if;

  -- Cambio de prioridad.
  if new.prioridad is distinct from old.prioridad then
    insert into public.ticket_historial (
      id_ticket,
      realizado_por,
      tipo_evento,
      prioridad_anterior,
      prioridad_nueva,
      detalle
    )
    values (
      new.id,
      auth.uid(),
      'CAMBIO_PRIORIDAD',
      old.prioridad,
      new.prioridad,
      'Prioridad modificada'
    );
  end if;

  return new;
end;
$function$;
CREATE FUNCTION public.registrar_creacion_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.ticket_historial (
    id_ticket,
    realizado_por,
    tipo_evento,
    estado_nuevo,
    detalle
  )
  values (
    new.id,
    new.id_solicitante,
    'CREACION',
    new.estado,
    'Ticket creado'
  );

  return new;
end;
$function$;
CREATE FUNCTION public.transicion_ticket_valida(estado_actual public.estado_ticket, estado_siguiente public.estado_ticket)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case estado_actual

    when 'NUEVO' then
      estado_siguiente in (
        'ASIGNADO',
        'EN_CURSO',
        'CANCELADO'
      )

    when 'ASIGNADO' then
      estado_siguiente in (
        'EN_CURSO',
        'RESUELTO',
        'CANCELADO'
      )

    when 'EN_CURSO' then
      estado_siguiente in (
        'RESUELTO',
        'CANCELADO'
      )

    when 'RESUELTO' then
      estado_siguiente in (
        'CERRADO',
        'REABIERTO'
      )

    when 'REABIERTO' then
      estado_siguiente in (
        'ASIGNADO',
        'EN_CURSO',
        'RESUELTO',
        'CANCELADO'
      )

    when 'CERRADO' then
      estado_siguiente = 'REABIERTO'

    when 'CANCELADO' then
      false

    else false
  end;
$function$;
CREATE FUNCTION public.validar_asignacion_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.asignado_a is not null then
    if not exists (
      select 1
      from public.perfiles
      where id = new.asignado_a
        and estado = 'ACTIVO'
        and rol in ('APOYO', 'ADMIN')
    ) then
      raise exception
        'El usuario asignado no pertenece al personal de apoyo';
    end if;
  end if;

  return new;
end;
$function$;
CREATE TABLE public.areas (id uuid DEFAULT gen_random_uuid() NOT NULL, nombre character varying(150) NOT NULL, nombre_corto character varying(30), piso smallint, referencia character varying(250), activo boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ADD CONSTRAINT areas_nombre_unique UNIQUE (nombre);
ALTER TABLE public.areas ADD CONSTRAINT areas_piso_valido CHECK (piso IS NULL OR piso >= '-2'::integer AND piso <= 20);
ALTER TABLE public.areas ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.areas TO anon;
GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.areas TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.areas TO service_role;
CREATE INDEX idx_areas_activas ON public.areas (activo, nombre);
CREATE TRIGGER trg_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE POLICY administrador_actualizar_areas ON public.areas FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY administrador_crear_areas ON public.areas FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY usuarios_ver_areas ON public.areas FOR SELECT TO authenticated USING (((activo = true) OR public.es_personal_apoyo()));
CREATE TABLE public.categorias (id uuid DEFAULT gen_random_uuid() NOT NULL, nombre character varying(100) NOT NULL, descripcion character varying(300), es_critico boolean DEFAULT false NOT NULL, activo boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ADD CONSTRAINT categorias_nombre_unique UNIQUE (nombre);
ALTER TABLE public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.categorias TO anon;
GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categorias TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.categorias TO service_role;
CREATE INDEX idx_categorias_activas ON public.categorias (activo, nombre);
CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE POLICY administrador_actualizar_categorias ON public.categorias FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY administrador_crear_categorias ON public.categorias FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY usuarios_ver_categorias ON public.categorias FOR SELECT TO authenticated USING (((activo = true) OR public.es_personal_apoyo()));
CREATE TABLE public.perfiles (id uuid NOT NULL, dni character varying(8) NOT NULL, nombres character varying(100) NOT NULL, apellidos character varying(150) NOT NULL, telefono character varying(15), rol public.user_role DEFAULT 'SOLICITANTE'::public.user_role NOT NULL, estado public.estado_perfil DEFAULT 'ACTIVO'::public.estado_perfil NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_apellidos_longitud CHECK (char_length(TRIM(BOTH FROM apellidos)) >= 2 AND char_length(TRIM(BOTH FROM apellidos)) <= 150);
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_dni_formato CHECK (dni::text ~ '^[0-9]{8}$'::text);
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_dni_unique UNIQUE (dni);
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_nombres_longitud CHECK (char_length(TRIM(BOTH FROM nombres)) >= 2 AND char_length(TRIM(BOTH FROM nombres)) <= 100);
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_pkey PRIMARY KEY (id);
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_telefono_formato CHECK (telefono IS NULL OR telefono::text ~ '^[0-9+]{9,15}$'::text);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.perfiles TO anon;
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.perfiles TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.perfiles TO service_role;
CREATE INDEX idx_perfiles_rol_estado ON public.perfiles (rol, estado);
CREATE INDEX idx_perfiles_nombre ON public.perfiles (nombres, apellidos);
CREATE TRIGGER trg_perfiles_updated_at BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE POLICY administrador_actualizar_perfiles ON public.perfiles FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY apoyo_ver_perfiles ON public.perfiles FOR SELECT TO authenticated USING (public.es_personal_apoyo());
CREATE POLICY perfil_ver_propio ON public.perfiles FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE TABLE public.ticket_archivos (id uuid DEFAULT gen_random_uuid() NOT NULL, id_ticket uuid NOT NULL, subido_por uuid NOT NULL, bucket character varying(100) DEFAULT 'ticket-archivos'::character varying NOT NULL, path text NOT NULL, nombre_original character varying(255), mime_type character varying(100), size_bytes bigint, created_at timestamp with time zone DEFAULT now() NOT NULL, deleted_at timestamp with time zone);
ALTER TABLE public.ticket_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_mime_valido CHECK (mime_type IS NULL OR (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying, 'image/webp'::character varying]::text[])));
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_path_unique UNIQUE (path);
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_size_valido CHECK (size_bytes IS NULL OR size_bytes >= 1 AND size_bytes <= 5242880);
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_subido_por_fkey FOREIGN KEY (subido_por) REFERENCES public.perfiles(id) ON DELETE RESTRICT;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_archivos TO anon;
GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.ticket_archivos TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_archivos TO service_role;
CREATE INDEX idx_ticket_archivos_ticket ON public.ticket_archivos (id_ticket, created_at);
CREATE INDEX idx_ticket_archivos_usuario ON public.ticket_archivos (subido_por);
CREATE POLICY apoyo_ver_archivos ON public.ticket_archivos FOR SELECT TO authenticated USING (public.es_personal_apoyo());
CREATE POLICY solicitante_ver_archivos_propios ON public.ticket_archivos FOR SELECT TO authenticated USING (public.es_propietario_ticket(id_ticket));
CREATE POLICY usuarios_registrar_archivos ON public.ticket_archivos FOR INSERT TO authenticated WITH CHECK (((subido_por = auth.uid()) AND (public.es_propietario_ticket(id_ticket) OR public.es_personal_apoyo())));
CREATE TABLE public.ticket_historial (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, id_ticket uuid NOT NULL, realizado_por uuid, tipo_evento public.tipo_evento_ticket NOT NULL, estado_anterior public.estado_ticket, estado_nuevo public.estado_ticket, asignado_anterior uuid, asignado_nuevo uuid, prioridad_anterior public.prioridad_ticket, prioridad_nueva public.prioridad_ticket, detalle character varying(1000), created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.ticket_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_historial ADD CONSTRAINT ticket_historial_asignado_anterior_fkey FOREIGN KEY (asignado_anterior) REFERENCES public.perfiles(id) ON DELETE SET NULL;
ALTER TABLE public.ticket_historial ADD CONSTRAINT ticket_historial_asignado_nuevo_fkey FOREIGN KEY (asignado_nuevo) REFERENCES public.perfiles(id) ON DELETE SET NULL;
ALTER TABLE public.ticket_historial ADD CONSTRAINT ticket_historial_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_historial ADD CONSTRAINT ticket_historial_realizado_por_fkey FOREIGN KEY (realizado_por) REFERENCES public.perfiles(id) ON DELETE SET NULL;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_historial TO anon;
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.ticket_historial TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_historial TO service_role;
CREATE INDEX idx_ticket_historial_ticket ON public.ticket_historial (id_ticket, created_at);
CREATE INDEX idx_ticket_historial_usuario ON public.ticket_historial (realizado_por, created_at DESC);
CREATE POLICY apoyo_ver_historial ON public.ticket_historial FOR SELECT TO authenticated USING (public.es_personal_apoyo());
CREATE POLICY solicitante_ver_historial_propio ON public.ticket_historial FOR SELECT TO authenticated USING (public.es_propietario_ticket(id_ticket));
CREATE TABLE public.ticket_resoluciones (id uuid DEFAULT gen_random_uuid() NOT NULL, id_ticket uuid NOT NULL, resuelto_por uuid NOT NULL, diagnostico text, solucion text NOT NULL, confirmado_por_solicitante boolean, comentario_solicitante character varying(1000), created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.ticket_resoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_resoluciones ADD CONSTRAINT ticket_resoluciones_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_resoluciones ADD CONSTRAINT ticket_resoluciones_resuelto_por_fkey FOREIGN KEY (resuelto_por) REFERENCES public.perfiles(id) ON DELETE RESTRICT;
ALTER TABLE public.ticket_resoluciones ADD CONSTRAINT ticket_resoluciones_solucion_longitud CHECK (char_length(TRIM(BOTH FROM solucion)) >= 5 AND char_length(TRIM(BOTH FROM solucion)) <= 3000);
ALTER TABLE public.ticket_resoluciones ADD CONSTRAINT ticket_resoluciones_ticket_unique UNIQUE (id_ticket);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_resoluciones TO anon;
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.ticket_resoluciones TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_resoluciones TO service_role;
CREATE INDEX idx_ticket_resoluciones_usuario ON public.ticket_resoluciones (resuelto_por);
CREATE TRIGGER trg_resoluciones_updated_at BEFORE UPDATE ON public.ticket_resoluciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE POLICY apoyo_ver_resoluciones ON public.ticket_resoluciones FOR SELECT TO authenticated USING (public.es_personal_apoyo());
CREATE POLICY solicitante_ver_resolucion_propia ON public.ticket_resoluciones FOR SELECT TO authenticated USING (public.es_propietario_ticket(id_ticket));
CREATE TABLE public.ticket_tipos_problemas (id uuid DEFAULT gen_random_uuid() NOT NULL, id_categoria uuid NOT NULL, nombre character varying(150) NOT NULL, descripcion character varying(300), prioridad public.prioridad_ticket DEFAULT 'MEDIO'::public.prioridad_ticket NOT NULL, activo boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.ticket_tipos_problemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tipos_problemas ADD CONSTRAINT ticket_tipos_problemas_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id) ON DELETE RESTRICT;
ALTER TABLE public.ticket_tipos_problemas ADD CONSTRAINT ticket_tipos_problemas_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_tipos_problemas ADD CONSTRAINT tipos_problemas_nombre_categoria_unique UNIQUE (id_categoria, nombre);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_tipos_problemas TO anon;
GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_tipos_problemas TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.ticket_tipos_problemas TO service_role;
CREATE INDEX idx_tipos_problemas_categoria ON public.ticket_tipos_problemas (id_categoria, activo, nombre);
CREATE TRIGGER trg_tipos_problemas_updated_at BEFORE UPDATE ON public.ticket_tipos_problemas FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE POLICY administrador_actualizar_tipos_problemas ON public.ticket_tipos_problemas FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY administrador_crear_tipos_problemas ON public.ticket_tipos_problemas FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY usuarios_ver_tipos_problemas ON public.ticket_tipos_problemas FOR SELECT TO authenticated USING (((activo = true) OR public.es_personal_apoyo()));
CREATE TABLE public.tickets (id uuid DEFAULT gen_random_uuid() NOT NULL, codigo character varying(30) NOT NULL, id_solicitante uuid NOT NULL, id_area uuid NOT NULL, id_categoria uuid NOT NULL, id_tipo_problema uuid, asunto character varying(150) NOT NULL, descripcion text NOT NULL, impacto public.nivel_impacto DEFAULT 'INDIVIDUAL'::public.nivel_impacto NOT NULL, trabajo_detenido boolean DEFAULT false NOT NULL, prioridad public.prioridad_ticket DEFAULT 'MEDIO'::public.prioridad_ticket NOT NULL, estado public.estado_ticket DEFAULT 'NUEVO'::public.estado_ticket NOT NULL, asignado_a uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, assigned_at timestamp with time zone, started_at timestamp with time zone, resolved_at timestamp with time zone, closed_at timestamp with time zone);
CREATE FUNCTION public.asignar_ticket(p_id_ticket uuid, p_id_apoyo uuid)
 RETURNS public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  resultado public.tickets;
begin
  if not public.es_personal_apoyo() then
    raise exception 'No tiene permiso para asignar tickets';
  end if;

  if not exists (
    select 1
    from public.perfiles
    where id = p_id_apoyo
      and estado = 'ACTIVO'
      and rol in ('APOYO', 'ADMIN')
  ) then
    raise exception 'El personal seleccionado no está disponible';
  end if;

  update public.tickets
  set
    asignado_a = p_id_apoyo,
    assigned_at = coalesce(assigned_at, now()),
    estado = case
      when estado in ('NUEVO', 'REABIERTO')
        then 'ASIGNADO'::public.estado_ticket
      else estado
    end
  where id = p_id_ticket
    and estado not in ('CERRADO', 'CANCELADO')
  returning *
  into resultado;

  if resultado.id is null then
    raise exception
      'No se encontró el ticket o no puede asignarse';
  end if;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.asignar_ticket(uuid, uuid) TO authenticated;
CREATE FUNCTION public.cambiar_estado_ticket(p_id_ticket uuid, p_nuevo_estado public.estado_ticket, p_detalle character varying DEFAULT NULL::character varying)
 RETURNS public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ticket_actual public.tickets;
  resultado public.tickets;
begin
  if not public.es_personal_apoyo() then
    raise exception
      'No tiene permiso para cambiar el estado';
  end if;

  select *
  into ticket_actual
  from public.tickets
  where id = p_id_ticket
  for update;

  if ticket_actual.id is null then
    raise exception 'No se encontró el ticket';
  end if;

  if p_nuevo_estado in ('RESUELTO', 'CERRADO', 'REABIERTO') then
    raise exception
      'Utilice la función específica para resolver, cerrar o reabrir';
  end if;

  if not public.transicion_ticket_valida(
    ticket_actual.estado,
    p_nuevo_estado
  ) then
    raise exception
      'No se permite cambiar el ticket de % a %',
      ticket_actual.estado,
      p_nuevo_estado;
  end if;

  update public.tickets
  set
    estado = p_nuevo_estado,

    started_at = case
      when p_nuevo_estado = 'EN_CURSO'
        then coalesce(started_at, now())
      else started_at
    end
  where id = p_id_ticket
  returning *
  into resultado;

  if p_detalle is not null
     and char_length(trim(p_detalle)) > 0 then

    update public.ticket_historial
    set detalle = trim(p_detalle)
    where id = (
      select id
      from public.ticket_historial
      where id_ticket = p_id_ticket
        and tipo_evento = 'CAMBIO_ESTADO'
      order by id desc
      limit 1
    );
  end if;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.cambiar_estado_ticket(uuid, public.estado_ticket, character varying) TO authenticated;
CREATE FUNCTION public.confirmar_solucion_ticket(p_id_ticket uuid, p_solucionado boolean, p_comentario character varying DEFAULT NULL::character varying)
 RETURNS public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ticket_actual public.tickets;
  resultado public.tickets;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión';
  end if;

  if p_solucionado is null then
    raise exception 'Debe confirmar o rechazar la solución';
  end if;

  if p_solucionado = false
     and (
       p_comentario is null
       or char_length(trim(p_comentario)) < 5
     ) then
    raise exception 'Debe indicar por qué la solución no resolvió el problema';
  end if;

  if p_solucionado = false
     and char_length(trim(p_comentario)) > 1000 then
    raise exception 'El comentario es demasiado largo';
  end if;

  select *
  into ticket_actual
  from public.tickets
  where id = p_id_ticket
    and id_solicitante = auth.uid()
  for update;

  if ticket_actual.id is null then
    raise exception
      'No se encontró el ticket o no le pertenece';
  end if;

  if ticket_actual.estado <> 'RESUELTO' then
    raise exception
      'El ticket aún no está pendiente de confirmación';
  end if;

  if not exists (
    select 1
    from public.ticket_resoluciones
    where id_ticket = p_id_ticket
  ) then
    raise exception 'El ticket no tiene una solución registrada';
  end if;

  update public.ticket_resoluciones
  set
    confirmado_por_solicitante = p_solucionado,
    comentario_solicitante = case
      when p_solucionado then null
      else nullif(trim(p_comentario), '')
    end
  where id_ticket = p_id_ticket;

  update public.tickets
  set
    estado = case
      when p_solucionado
        then 'CERRADO'::public.estado_ticket
      else 'REABIERTO'::public.estado_ticket
    end,

    closed_at = case
      when p_solucionado
        then now()
      else null
    end,

    resolved_at = case
      when p_solucionado
        then resolved_at
      else null
    end,

    asignado_a = case
      when p_solucionado
        then asignado_a
      else null
    end,

    assigned_at = case
      when p_solucionado
        then assigned_at
      else null
    end
  where id = p_id_ticket
  returning *
  into resultado;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.confirmar_solucion_ticket(uuid, boolean, character varying) TO authenticated;
CREATE FUNCTION public.reabrir_ticket(p_id_ticket uuid, p_motivo character varying)
 RETURNS public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ticket_actual public.tickets;
  resultado public.tickets;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión';
  end if;

  if p_motivo is null
     or char_length(trim(p_motivo)) < 5 then
    raise exception 'Debe indicar el motivo de reapertura';
  end if;

  if char_length(trim(p_motivo)) > 1000 then
    raise exception 'El motivo de reapertura es demasiado largo';
  end if;

  select *
  into ticket_actual
  from public.tickets
  where id = p_id_ticket
    and (
      id_solicitante = auth.uid()
      or public.es_personal_apoyo()
    )
  for update;

  if ticket_actual.id is null then
    raise exception
      'No se encontró el ticket o no tiene permiso';
  end if;

  if ticket_actual.estado <> 'CERRADO' then
    raise exception
      'Solo se puede reabrir un ticket cerrado';
  end if;

  update public.tickets
  set
    estado = 'REABIERTO',
    asignado_a = null,
    assigned_at = null,
    resolved_at = null,
    closed_at = null
  where id = p_id_ticket
  returning *
  into resultado;

  update public.ticket_historial
  set detalle = trim(p_motivo)
  where id = (
    select id
    from public.ticket_historial
    where id_ticket = p_id_ticket
      and tipo_evento = 'REAPERTURA'
    order by id desc
    limit 1
  );

  update public.ticket_resoluciones
  set
    confirmado_por_solicitante = null,
    comentario_solicitante = null,
    updated_at = now()
  where id_ticket = p_id_ticket;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.reabrir_ticket(uuid, character varying) TO authenticated;
CREATE FUNCTION public.resolver_ticket(p_id_ticket uuid, p_diagnostico text, p_solucion text)
 RETURNS public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ticket_actual public.tickets;
  resultado public.tickets;
begin
  if not public.es_personal_apoyo() then
    raise exception 'No tiene permiso para resolver tickets';
  end if;

  if p_solucion is null
     or char_length(trim(p_solucion)) < 5 then
    raise exception 'Debe ingresar una solución válida';
  end if;

  select *
  into ticket_actual
  from public.tickets
  where id = p_id_ticket
  for update;

  if ticket_actual.id is null then
    raise exception 'No se encontró el ticket';
  end if;

  if ticket_actual.estado not in (
    'ASIGNADO',
    'EN_CURSO',
    'REABIERTO'
  ) then
    raise exception
      'El ticket no puede resolverse desde el estado %',
      ticket_actual.estado;
  end if;

  insert into public.ticket_resoluciones (
    id_ticket,
    resuelto_por,
    diagnostico,
    solucion,
    confirmado_por_solicitante,
    comentario_solicitante
  )
  values (
    p_id_ticket,
    auth.uid(),
    nullif(trim(p_diagnostico), ''),
    trim(p_solucion),
    null,
    null
  )
  on conflict (id_ticket)
  do update set
    resuelto_por = excluded.resuelto_por,
    diagnostico = excluded.diagnostico,
    solucion = excluded.solucion,
    confirmado_por_solicitante = null,
    comentario_solicitante = null,
    updated_at = now();

  update public.tickets
  set
    estado = 'RESUELTO',
    resolved_at = now(),
    closed_at = null
  where id = p_id_ticket
  returning *
  into resultado;

  return resultado;
end;
$function$;
GRANT ALL ON FUNCTION public.resolver_ticket(uuid, text, text) TO authenticated;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_asignado_a_fkey FOREIGN KEY (asignado_a) REFERENCES public.perfiles(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_asunto_longitud CHECK (char_length(TRIM(BOTH FROM asunto)) >= 3 AND char_length(TRIM(BOTH FROM asunto)) <= 150);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_codigo_unique UNIQUE (codigo);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_descripcion_longitud CHECK (char_length(TRIM(BOTH FROM descripcion)) >= 5 AND char_length(TRIM(BOTH FROM descripcion)) <= 3000);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_id_area_fkey FOREIGN KEY (id_area) REFERENCES public.areas(id) ON DELETE RESTRICT;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id) ON DELETE RESTRICT;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_id_solicitante_fkey FOREIGN KEY (id_solicitante) REFERENCES public.perfiles(id) ON DELETE RESTRICT;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_id_tipo_problema_fkey FOREIGN KEY (id_tipo_problema) REFERENCES public.ticket_tipos_problemas(id) ON DELETE RESTRICT;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.ticket_archivos ADD CONSTRAINT ticket_archivos_id_ticket_fkey FOREIGN KEY (id_ticket) REFERENCES public.tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_historial ADD CONSTRAINT ticket_historial_id_ticket_fkey FOREIGN KEY (id_ticket) REFERENCES public.tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_resoluciones ADD CONSTRAINT ticket_resoluciones_id_ticket_fkey FOREIGN KEY (id_ticket) REFERENCES public.tickets(id) ON DELETE CASCADE;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.tickets TO anon;
GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.tickets TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.tickets TO service_role;
CREATE INDEX idx_tickets_estado ON public.tickets (estado, created_at DESC);
CREATE INDEX idx_tickets_solicitante ON public.tickets (id_solicitante, created_at DESC);
CREATE INDEX idx_tickets_area ON public.tickets (id_area, created_at DESC);
CREATE INDEX idx_tickets_asignado ON public.tickets (asignado_a, estado, created_at DESC);
CREATE INDEX idx_tickets_prioridad ON public.tickets (prioridad, created_at DESC);
CREATE INDEX idx_tickets_categoria ON public.tickets (id_categoria, created_at DESC);
CREATE TRIGGER trg_preparar_ticket BEFORE INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.preparar_ticket();
CREATE TRIGGER trg_registrar_cambios_ticket AFTER UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.registrar_cambios_ticket();
CREATE TRIGGER trg_registrar_creacion_ticket AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.registrar_creacion_ticket();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE TRIGGER trg_validar_asignacion_ticket BEFORE INSERT OR UPDATE OF asignado_a ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.validar_asignacion_ticket();
CREATE POLICY apoyo_ver_todos_tickets ON public.tickets FOR SELECT TO authenticated USING (public.es_personal_apoyo());
CREATE POLICY solicitante_crear_ticket ON public.tickets FOR INSERT TO authenticated WITH CHECK ((id_solicitante = auth.uid()));
CREATE POLICY solicitante_ver_sus_tickets ON public.tickets FOR SELECT TO authenticated USING ((id_solicitante = auth.uid()));

-- Data API access is explicit. The generated baseline inherited legacy default
-- privileges, so revoke them before granting only what each role needs.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

GRANT SELECT, UPDATE ON public.perfiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.areas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ticket_tipos_problemas TO authenticated;
GRANT SELECT, INSERT ON public.tickets TO authenticated;
GRANT SELECT, INSERT ON public.ticket_archivos TO authenticated;
GRANT SELECT ON public.ticket_historial TO authenticated;
GRANT SELECT ON public.ticket_resoluciones TO authenticated;

GRANT EXECUTE ON FUNCTION public.es_personal_apoyo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_administrador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_propietario_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_ticket(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_ticket(uuid, public.estado_ticket, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_ticket(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_solucion_ticket(uuid, boolean, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_ticket(uuid, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_metricas_soporte(date, date) TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
