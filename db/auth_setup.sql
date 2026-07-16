begin;

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

drop trigger if exists trg_crear_perfil_nuevo_usuario on auth.users;

create trigger trg_crear_perfil_nuevo_usuario
after insert on auth.users
for each row
execute function public.crear_perfil_nuevo_usuario();

commit;
