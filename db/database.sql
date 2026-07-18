
create extension if not exists pgcrypto
with schema extensions;


-- ENUMS

create type public.user_role as enum (
  'SOLICITANTE',
  'APOYO',
  'ADMIN'
);

create type public.estado_perfil as enum (
  'ACTIVO',
  'INACTIVO',
  'BLOQUEADO'
);

create type public.nivel_impacto as enum (
  'INDIVIDUAL',
  'USUARIOS_MULTIPLES',
  'TODA_EL_AREA',
  'SERVICIO_INTERRUMPIDO'
);

create type public.prioridad_ticket as enum (
  'BAJO',
  'MEDIO',
  'ALTO',
  'CRITICO'
);

create type public.estado_ticket as enum (
  'NUEVO',
  'ASIGNADO',
  'EN_CURSO',
  'RESUELTO',
  'CERRADO',
  'CANCELADO',
  'REABIERTO'
);

create type public.tipo_evento_ticket as enum (
  'CREACION',
  'ASIGNACION',
  'REASIGNACION',
  'CAMBIO_ESTADO',
  'CAMBIO_PRIORIDAD',
  'RESOLUCION',
  'CIERRE',
  'REAPERTURA',
  'COMENTARIO'
);


-- ============================================================
-- 3. SECUENCIA PARA CÓDIGOS
-- ============================================================

create sequence public.ticket_codigo_seq
  start with 1
  increment by 1
  minvalue 1
  cache 10;


-- ============================================================
-- 4. ÁREAS
-- ============================================================

create table public.areas (
  id uuid primary key
    default gen_random_uuid(),

  nombre varchar(150) not null,
  nombre_corto varchar(30),

  piso smallint,
  referencia varchar(250),

  activo boolean not null
    default true,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint areas_nombre_unique
    unique (nombre),

  constraint areas_piso_valido
    check (
      piso is null
      or piso between -2 and 20
    )
);

create index idx_areas_activas
  on public.areas(activo, nombre);


-- ============================================================
-- 5. PERFILES
-- ============================================================
--
-- El ID será el mismo ID generado por Supabase Auth.
-- Las contraseñas o PIN no se guardan en esta tabla.
-- ============================================================

create table public.perfiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  dni varchar(8) not null,
  nombres varchar(100) not null,
  apellidos varchar(150) not null,
  telefono varchar(15),

  rol public.user_role not null
    default 'SOLICITANTE',

  estado public.estado_perfil not null
    default 'ACTIVO',

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint perfiles_dni_unique
    unique (dni),

  constraint perfiles_dni_formato
    check (dni ~ '^[0-9]{8}$'),

  constraint perfiles_nombres_longitud
    check (
      char_length(trim(nombres)) between 2 and 100
    ),

  constraint perfiles_apellidos_longitud
    check (
      char_length(trim(apellidos)) between 2 and 150
    ),

  constraint perfiles_telefono_formato
    check (
      telefono is null
      or telefono ~ '^[0-9+]{9,15}$'
    )
);

create index idx_perfiles_rol_estado
  on public.perfiles(rol, estado);

create index idx_perfiles_nombre
  on public.perfiles(nombres, apellidos);


-- ============================================================
-- 5.1 CREAR PERFIL DESDE SUPABASE AUTH
-- ============================================================

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger trg_crear_perfil_nuevo_usuario
after insert on auth.users
for each row
execute function public.crear_perfil_nuevo_usuario();


-- ============================================================
-- 6. CATEGORÍAS
-- ============================================================

create table public.categorias (
  id uuid primary key
    default gen_random_uuid(),

  nombre varchar(100) not null,
  descripcion varchar(300),

  es_critico boolean not null
    default false,

  activo boolean not null
    default true,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint categorias_nombre_unique
    unique (nombre)
);

create index idx_categorias_activas
  on public.categorias(activo, nombre);


-- ============================================================
-- 7. TIPOS DE PROBLEMA
-- ============================================================
--
-- Cada tipo de problema pertenece a una categoría.
-- ============================================================

create table public.ticket_tipos_problemas (
  id uuid primary key
    default gen_random_uuid(),

  id_categoria uuid not null
    references public.categorias(id)
    on delete restrict,

  nombre varchar(150) not null,
  descripcion varchar(300),

  prioridad public.prioridad_ticket not null
    default 'MEDIO',

  activo boolean not null
    default true,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint tipos_problemas_nombre_categoria_unique
    unique (id_categoria, nombre)
);

create index idx_tipos_problemas_categoria
  on public.ticket_tipos_problemas(
    id_categoria,
    activo,
    nombre
  );


-- ============================================================
-- 8. TICKETS
-- ============================================================

create table public.tickets (
  id uuid primary key
    default gen_random_uuid(),

  codigo varchar(30) not null,

  id_solicitante uuid not null
    references public.perfiles(id)
    on delete restrict,

  id_area uuid not null
    references public.areas(id)
    on delete restrict,

  id_categoria uuid not null
    references public.categorias(id)
    on delete restrict,

  id_tipo_problema uuid
    references public.ticket_tipos_problemas(id)
    on delete restrict,

  asunto varchar(150) not null,
  descripcion text not null,

  impacto public.nivel_impacto not null
    default 'INDIVIDUAL',

  trabajo_detenido boolean not null
    default false,

  prioridad public.prioridad_ticket not null
    default 'MEDIO',

  estado public.estado_ticket not null
    default 'NUEVO',

  asignado_a uuid
    references public.perfiles(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  assigned_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,

  constraint tickets_codigo_unique
    unique (codigo),

  constraint tickets_asunto_longitud
    check (
      char_length(trim(asunto)) between 3 and 150
    ),

  constraint tickets_descripcion_longitud
    check (
      char_length(trim(descripcion)) between 5 and 3000
    )
);

create index idx_tickets_solicitante
  on public.tickets(
    id_solicitante,
    created_at desc
  );

create index idx_tickets_estado
  on public.tickets(
    estado,
    created_at desc
  );

create index idx_tickets_prioridad
  on public.tickets(
    prioridad,
    created_at desc
  );

create index idx_tickets_asignado
  on public.tickets(
    asignado_a,
    estado,
    created_at desc
  );

create index idx_tickets_area
  on public.tickets(
    id_area,
    created_at desc
  );

create index idx_tickets_categoria
  on public.tickets(
    id_categoria,
    created_at desc
  );


-- ============================================================
-- 9. FOTOS O ARCHIVOS DEL TICKET
-- ============================================================
--
-- No se guarda una URL porque una URL firmada puede expirar.
-- Solo se guarda la ruta del archivo dentro de Storage.
-- ============================================================

create table public.ticket_archivos (
  id uuid primary key
    default gen_random_uuid(),

  id_ticket uuid not null
    references public.tickets(id)
    on delete cascade,

  subido_por uuid not null
    references public.perfiles(id)
    on delete restrict,

  bucket varchar(100) not null
    default 'ticket-archivos',

  path text not null,

  nombre_original varchar(255),
  mime_type varchar(100),
  size_bytes bigint,

  created_at timestamptz not null
    default now(),

  deleted_at timestamptz,

  constraint ticket_archivos_path_unique
    unique (path),

  constraint ticket_archivos_size_valido
    check (
      size_bytes is null
      or size_bytes between 1 and 5242880
    ),

  constraint ticket_archivos_mime_valido
    check (
      mime_type is null
      or mime_type in (
        'image/jpeg',
        'image/png',
        'image/webp'
      )
    )
);

create index idx_ticket_archivos_ticket
  on public.ticket_archivos(
    id_ticket,
    created_at
  );

create index idx_ticket_archivos_usuario
  on public.ticket_archivos(subido_por);


-- ============================================================
-- 10. HISTORIAL DEL TICKET
-- ============================================================
--
-- Esta tabla brinda la trazabilidad mínima del MVP:
-- creación, asignación, cambio de estado, resolución,
-- cierre y reapertura.
-- ============================================================

create table public.ticket_historial (
  id bigint generated always as identity
    primary key,

  id_ticket uuid not null
    references public.tickets(id)
    on delete cascade,

  realizado_por uuid
    references public.perfiles(id)
    on delete set null,

  tipo_evento public.tipo_evento_ticket not null,

  estado_anterior public.estado_ticket,
  estado_nuevo public.estado_ticket,

  asignado_anterior uuid
    references public.perfiles(id)
    on delete set null,

  asignado_nuevo uuid
    references public.perfiles(id)
    on delete set null,

  prioridad_anterior public.prioridad_ticket,
  prioridad_nueva public.prioridad_ticket,

  detalle varchar(1000),

  created_at timestamptz not null
    default now()
);

create index idx_ticket_historial_ticket
  on public.ticket_historial(
    id_ticket,
    created_at
  );

create index idx_ticket_historial_usuario
  on public.ticket_historial(
    realizado_por,
    created_at desc
  );


-- ============================================================
-- 11. RESOLUCIÓN
-- ============================================================
--
-- Solo existe una resolución actual por ticket.
-- Al reabrir y resolver nuevamente se actualiza.
-- El historial conservará las reaperturas.
-- ============================================================

create table public.ticket_resoluciones (
  id uuid primary key
    default gen_random_uuid(),

  id_ticket uuid not null
    references public.tickets(id)
    on delete cascade,

  resuelto_por uuid not null
    references public.perfiles(id)
    on delete restrict,

  diagnostico text,
  solucion text not null,

  confirmado_por_solicitante boolean,
  comentario_solicitante varchar(1000),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint ticket_resoluciones_ticket_unique
    unique (id_ticket),

  constraint ticket_resoluciones_solucion_longitud
    check (
      char_length(trim(solucion)) between 5 and 3000
    )
);

create index idx_ticket_resoluciones_usuario
  on public.ticket_resoluciones(resuelto_por);


-- ============================================================
-- 12. FUNCIÓN PARA UPDATED_AT
-- ============================================================

create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ============================================================
-- 13. TRIGGERS UPDATED_AT
-- ============================================================

create trigger trg_areas_updated_at
before update on public.areas
for each row
execute function public.actualizar_updated_at();

create trigger trg_perfiles_updated_at
before update on public.perfiles
for each row
execute function public.actualizar_updated_at();

create trigger trg_categorias_updated_at
before update on public.categorias
for each row
execute function public.actualizar_updated_at();

create trigger trg_tipos_problemas_updated_at
before update on public.ticket_tipos_problemas
for each row
execute function public.actualizar_updated_at();

create trigger trg_tickets_updated_at
before update on public.tickets
for each row
execute function public.actualizar_updated_at();

create trigger trg_resoluciones_updated_at
before update on public.ticket_resoluciones
for each row
execute function public.actualizar_updated_at();


-- ============================================================
-- 14. FUNCIONES DE ROLES
-- ============================================================

create or replace function public.es_personal_apoyo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and estado = 'ACTIVO'
      and rol in ('APOYO', 'ADMIN')
  );
$$;

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and estado = 'ACTIVO'
      and rol = 'ADMIN'
  );
$$;

create or replace function public.es_propietario_ticket(
  ticket_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tickets
    where id = ticket_id
      and id_solicitante = auth.uid()
  );
$$;


-- ============================================================
-- 15. GENERAR CÓDIGO DE TICKET
-- ============================================================
--
-- Ejemplo:
-- ST-2026-000001
-- ============================================================

create or replace function public.generar_codigo_ticket()
returns text
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 16. PREPARAR TICKET ANTES DE CREARLO
-- ============================================================

create or replace function public.preparar_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger trg_preparar_ticket
before insert on public.tickets
for each row
execute function public.preparar_ticket();


-- ============================================================
-- 17. REGISTRAR CREACIÓN DEL TICKET
-- ============================================================

create or replace function public.registrar_creacion_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger trg_registrar_creacion_ticket
after insert on public.tickets
for each row
execute function public.registrar_creacion_ticket();


-- ============================================================
-- 18. VALIDAR USUARIO ASIGNADO
-- ============================================================

create or replace function public.validar_asignacion_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger trg_validar_asignacion_ticket
before insert or update of asignado_a
on public.tickets
for each row
execute function public.validar_asignacion_ticket();


-- ============================================================
-- 19. VALIDAR TRANSICIONES DE ESTADO
-- ============================================================

create or replace function public.transicion_ticket_valida(
  estado_actual public.estado_ticket,
  estado_siguiente public.estado_ticket
)
returns boolean
language sql
immutable
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 20. REGISTRAR CAMBIOS DEL TICKET
-- ============================================================

create or replace function public.registrar_cambios_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger trg_registrar_cambios_ticket
after update on public.tickets
for each row
execute function public.registrar_cambios_ticket();


-- ============================================================
-- 21. RPC: ASIGNAR TICKET
-- ============================================================

create or replace function public.asignar_ticket(
  p_id_ticket uuid,
  p_id_apoyo uuid
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 22. RPC: CAMBIAR ESTADO
-- ============================================================

create or replace function public.cambiar_estado_ticket(
  p_id_ticket uuid,
  p_nuevo_estado public.estado_ticket,
  p_detalle varchar default null
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 23. RPC: RESOLVER TICKET
-- ============================================================

create or replace function public.resolver_ticket(
  p_id_ticket uuid,
  p_diagnostico text,
  p_solucion text
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 24. RPC: CONFIRMAR O REABRIR TICKET
-- ============================================================
--
-- Esta función la utiliza el solicitante cuando soporte marca
-- el ticket como RESUELTO.
--
-- p_solucionado = true:
--   El ticket pasa a CERRADO.
--
-- p_solucionado = false:
--   El ticket pasa a REABIERTO.
-- ============================================================

create or replace function public.confirmar_solucion_ticket(
  p_id_ticket uuid,
  p_solucionado boolean,
  p_comentario varchar default null
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 25. RPC: REABRIR TICKET CERRADO
-- ============================================================
--
-- Permite reabrir un ticket cerrado cuando el problema
-- reaparece poco después.
-- ============================================================

create or replace function public.reabrir_ticket(
  p_id_ticket uuid,
  p_motivo varchar
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 25.1 RPC: MÉTRICAS OPERATIVAS DE SOPORTE
-- ============================================================

create or replace function public.obtener_metricas_soporte(
  p_desde date,
  p_hasta date
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
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
$$;


-- ============================================================
-- 26. ROW LEVEL SECURITY
-- ============================================================

alter table public.areas
  enable row level security;

alter table public.perfiles
  enable row level security;

alter table public.categorias
  enable row level security;

alter table public.ticket_tipos_problemas
  enable row level security;

alter table public.tickets
  enable row level security;

alter table public.ticket_archivos
  enable row level security;

alter table public.ticket_historial
  enable row level security;

alter table public.ticket_resoluciones
  enable row level security;


-- ============================================================
-- 27. POLÍTICAS DE PERFILES
-- ============================================================

create policy "perfil_ver_propio"
on public.perfiles
for select
to authenticated
using (
  id = auth.uid()
);

create policy "apoyo_ver_perfiles"
on public.perfiles
for select
to authenticated
using (
  public.es_personal_apoyo()
);

create policy "administrador_actualizar_perfiles"
on public.perfiles
for update
to authenticated
using (
  public.es_administrador()
)
with check (
  public.es_administrador()
);


-- ============================================================
-- 28. POLÍTICAS DE ÁREAS
-- ============================================================

create policy "usuarios_ver_areas"
on public.areas
for select
to authenticated
using (
  activo = true
  or public.es_personal_apoyo()
);

create policy "administrador_crear_areas"
on public.areas
for insert
to authenticated
with check (
  public.es_administrador()
);

create policy "administrador_actualizar_areas"
on public.areas
for update
to authenticated
using (
  public.es_administrador()
)
with check (
  public.es_administrador()
);


-- ============================================================
-- 29. POLÍTICAS DE CATEGORÍAS
-- ============================================================

create policy "usuarios_ver_categorias"
on public.categorias
for select
to authenticated
using (
  activo = true
  or public.es_personal_apoyo()
);

create policy "administrador_crear_categorias"
on public.categorias
for insert
to authenticated
with check (
  public.es_administrador()
);

create policy "administrador_actualizar_categorias"
on public.categorias
for update
to authenticated
using (
  public.es_administrador()
)
with check (
  public.es_administrador()
);


-- ============================================================
-- 30. POLÍTICAS DE TIPOS DE PROBLEMA
-- ============================================================

create policy "usuarios_ver_tipos_problemas"
on public.ticket_tipos_problemas
for select
to authenticated
using (
  activo = true
  or public.es_personal_apoyo()
);

create policy "administrador_crear_tipos_problemas"
on public.ticket_tipos_problemas
for insert
to authenticated
with check (
  public.es_administrador()
);

create policy "administrador_actualizar_tipos_problemas"
on public.ticket_tipos_problemas
for update
to authenticated
using (
  public.es_administrador()
)
with check (
  public.es_administrador()
);


-- ============================================================
-- 31. POLÍTICAS DE TICKETS
-- ============================================================

create policy "solicitante_ver_sus_tickets"
on public.tickets
for select
to authenticated
using (
  id_solicitante = auth.uid()
);

create policy "apoyo_ver_todos_tickets"
on public.tickets
for select
to authenticated
using (
  public.es_personal_apoyo()
);

create policy "solicitante_crear_ticket"
on public.tickets
for insert
to authenticated
with check (
  id_solicitante = auth.uid()
);


-- No se habilita UPDATE directo.
-- Los cambios se hacen mediante las funciones RPC.


-- ============================================================
-- 32. POLÍTICAS DE ARCHIVOS
-- ============================================================

create policy "solicitante_ver_archivos_propios"
on public.ticket_archivos
for select
to authenticated
using (
  public.es_propietario_ticket(id_ticket)
);

create policy "apoyo_ver_archivos"
on public.ticket_archivos
for select
to authenticated
using (
  public.es_personal_apoyo()
);

create policy "usuarios_registrar_archivos"
on public.ticket_archivos
for insert
to authenticated
with check (
  subido_por = auth.uid()
  and (
    public.es_propietario_ticket(id_ticket)
    or public.es_personal_apoyo()
  )
);


-- ============================================================
-- 33. POLÍTICAS DE HISTORIAL
-- ============================================================

create policy "solicitante_ver_historial_propio"
on public.ticket_historial
for select
to authenticated
using (
  public.es_propietario_ticket(id_ticket)
);

create policy "apoyo_ver_historial"
on public.ticket_historial
for select
to authenticated
using (
  public.es_personal_apoyo()
);


-- ============================================================
-- 34. POLÍTICAS DE RESOLUCIONES
-- ============================================================

create policy "solicitante_ver_resolucion_propia"
on public.ticket_resoluciones
for select
to authenticated
using (
  public.es_propietario_ticket(id_ticket)
);

create policy "apoyo_ver_resoluciones"
on public.ticket_resoluciones
for select
to authenticated
using (
  public.es_personal_apoyo()
);


-- ============================================================
-- 35. PERMISOS
-- ============================================================

grant usage on schema public
to authenticated;

grant select on public.perfiles
to authenticated;

grant select, insert, update on public.areas
to authenticated;

grant select, insert, update on public.categorias
to authenticated;

grant select, insert, update
on public.ticket_tipos_problemas
to authenticated;

grant select, insert on public.tickets
to authenticated;

grant select, insert on public.ticket_archivos
to authenticated;

grant select on public.ticket_historial
to authenticated;

grant select on public.ticket_resoluciones
to authenticated;


-- ============================================================
-- 36. PERMISOS PARA FUNCIONES RPC
-- ============================================================

revoke all on function public.asignar_ticket(uuid, uuid)
from public;

revoke all on function public.cambiar_estado_ticket(
  uuid,
  public.estado_ticket,
  varchar
)
from public;

revoke all on function public.resolver_ticket(
  uuid,
  text,
  text
)
from public;

revoke all on function public.confirmar_solucion_ticket(
  uuid,
  boolean,
  varchar
)
from public;

revoke all on function public.reabrir_ticket(
  uuid,
  varchar
)
from public;

grant execute on function public.asignar_ticket(uuid, uuid)
to authenticated;

grant execute on function public.cambiar_estado_ticket(
  uuid,
  public.estado_ticket,
  varchar
)
to authenticated;

grant execute on function public.resolver_ticket(
  uuid,
  text,
  text
)
to authenticated;

grant execute on function public.confirmar_solucion_ticket(
  uuid,
  boolean,
  varchar
)
to authenticated;

grant execute on function public.reabrir_ticket(
  uuid,
  varchar
)
to authenticated;

revoke all on function public.obtener_metricas_soporte(date, date)
from public;

grant execute on function public.obtener_metricas_soporte(date, date)
to authenticated;


-- ============================================================
-- 37. BUCKET PRIVADO PARA FOTOS
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ticket-archivos',
  'ticket-archivos',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 38. POLÍTICAS DE STORAGE
-- ============================================================
--
-- Formato recomendado:
--
-- {id_usuario}/{id_ticket}/{uuid}.webp
-- ============================================================

create policy "subir_archivo_ticket_propio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-archivos'
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (
    select 1
    from public.tickets
    where id::text = split_part(name, '/', 2)
      and (
        id_solicitante = auth.uid()
        or public.es_personal_apoyo()
      )
  )
);

create policy "ver_archivo_ticket_propio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-archivos'
  and exists (
    select 1
    from public.tickets
    where id::text = split_part(name, '/', 2)
      and (
        id_solicitante = auth.uid()
        or public.es_personal_apoyo()
      )
  )
);

-- Se usa únicamente para compensar una subida cuando falla el
-- registro de metadatos. La interfaz no ofrece borrado de archivos.
create policy "limpiar_subida_archivo_propia"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ticket-archivos'
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (
    select 1
    from public.tickets
    where id::text = split_part(name, '/', 2)
      and (
        id_solicitante = auth.uid()
        or public.es_personal_apoyo()
      )
  )
);


-- ============================================================
-- 39. DATOS INICIALES: ÁREAS
-- ============================================================

insert into public.areas (
  nombre,
  nombre_corto,
  piso,
  referencia
)
values
  (
    'Alcaldía',
    'ALC',
    2,
    null
  ),
  (
    'Gerencia Municipal',
    'GM',
    2,
    null
  ),
  (
    'Secretaría General',
    'SG',
    2,
    null
  ),
  (
    'Unidad de Informática',
    'UI',
    3,
    null
  ),
  (
    'Recursos Humanos',
    'RRHH',
    2,
    null
  ),
  (
    'Tesorería',
    'TES',
    1,
    null
  ),
  (
    'Contabilidad',
    'CONT',
    1,
    null
  ),
  (
    'Logística y Abastecimiento',
    'LOG',
    1,
    null
  ),
  (
    'Presupuesto',
    'PPTO',
    2,
    null
  ),
  (
    'Rentas',
    'REN',
    1,
    null
  ),
  (
    'Trámite Documentario',
    'TD',
    1,
    null
  ),
  (
    'Otro',
    'OTRO',
    null,
    null
  )
on conflict (nombre)
do nothing;


-- ============================================================
-- 40. DATOS INICIALES: CATEGORÍAS
-- ============================================================

insert into public.categorias (
  nombre,
  descripcion,
  es_critico
)
values
  (
    'Internet y red',
    'Problemas de conexión a internet, Wi-Fi o red local.',
    false
  ),
  (
    'Computadora o laptop',
    'Problemas de funcionamiento de computadoras y laptops.',
    false
  ),
  (
    'Impresora',
    'Problemas de impresión, conexión, tinta o papel.',
    false
  ),
  (
    'Escáner',
    'Problemas para escanear documentos.',
    false
  ),
  (
    'SIGA',
    'Errores, acceso o funcionamiento del sistema SIGA.',
    false
  ),
  (
    'SIAF',
    'Errores, acceso o funcionamiento del sistema SIAF.',
    false
  ),
  (
    'Acceso o contraseña',
    'Problemas relacionados con usuarios y contraseñas.',
    false
  ),
  (
    'Instalación de programas',
    'Instalación o configuración de programas.',
    false
  ),
  (
    'Seguridad informática',
    'Virus, accesos sospechosos o pérdida de información.',
    true
  ),
  (
    'Otro',
    'Problema que no pertenece a las categorías anteriores.',
    false
  )
on conflict (nombre)
do nothing;


-- ============================================================
-- 41. DATOS INICIALES: TIPOS DE PROBLEMA
-- ============================================================

insert into public.ticket_tipos_problemas (
  id_categoria,
  nombre,
  prioridad
)
select
  categoria.id,
  datos.nombre,
  datos.prioridad::public.prioridad_ticket
from public.categorias categoria
join (
  values
    (
      'Internet y red',
      'No tengo acceso a internet',
      'MEDIO'
    ),
    (
      'Internet y red',
      'Toda el área está sin internet',
      'ALTO'
    ),
    (
      'Internet y red',
      'Internet lento',
      'BAJO'
    ),
    (
      'Computadora o laptop',
      'No enciende',
      'ALTO'
    ),
    (
      'Computadora o laptop',
      'Está muy lenta',
      'BAJO'
    ),
    (
      'Computadora o laptop',
      'Se apaga o reinicia',
      'MEDIO'
    ),
    (
      'Impresora',
      'No enciende',
      'MEDIO'
    ),
    (
      'Impresora',
      'No imprime',
      'MEDIO'
    ),
    (
      'Impresora',
      'Imprime borroso',
      'BAJO'
    ),
    (
      'Impresora',
      'Papel atascado',
      'BAJO'
    ),
    (
      'Impresora',
      'No aparece en la computadora',
      'MEDIO'
    ),
    (
      'SIGA',
      'No puedo ingresar',
      'MEDIO'
    ),
    (
      'SIGA',
      'El sistema muestra un error',
      'MEDIO'
    ),
    (
      'SIAF',
      'No puedo ingresar',
      'MEDIO'
    ),
    (
      'SIAF',
      'El sistema muestra un error',
      'MEDIO'
    ),
    (
      'Acceso o contraseña',
      'Olvidé mi contraseña',
      'BAJO'
    ),
    (
      'Acceso o contraseña',
      'Mi usuario está bloqueado',
      'MEDIO'
    ),
    (
      'Instalación de programas',
      'Instalar un programa',
      'BAJO'
    ),
    (
      'Seguridad informática',
      'Posible virus',
      'CRITICO'
    ),
    (
      'Seguridad informática',
      'Acceso sospechoso',
      'CRITICO'
    ),
    (
      'Otro',
      'Otro problema',
      'MEDIO'
    )
) as datos(
  nombre_categoria,
  nombre,
  prioridad
)
  on categoria.nombre = datos.nombre_categoria
on conflict (id_categoria, nombre)
do nothing;


-- ============================================================
-- FIN DEL SCRIPT MVP
-- ============================================================
