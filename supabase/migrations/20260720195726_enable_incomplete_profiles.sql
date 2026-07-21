BEGIN;

ALTER TABLE public.perfiles
  ALTER COLUMN nombres DROP NOT NULL,
  ALTER COLUMN apellidos DROP NOT NULL,
  ADD COLUMN debe_cambiar_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.perfiles
  ALTER COLUMN debe_cambiar_password SET DEFAULT true;

CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  nuevo_dni text;
BEGIN
  nuevo_dni := new.raw_user_meta_data ->> 'dni';

  IF nuevo_dni IS NULL
     OR nuevo_dni !~ '^[0-9]{8}$'
     OR new.email <> nuevo_dni || '@mdsj.com' THEN
    RAISE EXCEPTION 'Los datos de registro no son válidos';
  END IF;

  INSERT INTO public.perfiles (id, dni)
  VALUES (new.id, nuevo_dni);

  RETURN new;
END;
$$;

CREATE FUNCTION public.actualizar_mi_perfil(
  p_nombres character varying,
  p_apellidos character varying,
  p_telefono character varying
)
RETURNS public.perfiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  resultado public.perfiles;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Debe iniciar sesión para actualizar su perfil';
  END IF;

  UPDATE public.perfiles
  SET nombres = trim(p_nombres),
      apellidos = trim(p_apellidos),
      telefono = nullif(trim(p_telefono), '')
  WHERE id = (SELECT auth.uid())
  RETURNING * INTO resultado;

  IF resultado.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil';
  END IF;

  RETURN resultado;
END;
$$;

CREATE FUNCTION public.marcar_password_actualizado()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Debe iniciar sesión para actualizar su contraseña';
  END IF;

  UPDATE public.perfiles
  SET debe_cambiar_password = false
  WHERE id = (SELECT auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el perfil';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_mi_perfil(character varying, character varying, character varying) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.marcar_password_actualizado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_mi_perfil(character varying, character varying, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_password_actualizado() TO authenticated;
GRANT ALL ON FUNCTION public.actualizar_mi_perfil(character varying, character varying, character varying) TO service_role;
GRANT ALL ON FUNCTION public.marcar_password_actualizado() TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
