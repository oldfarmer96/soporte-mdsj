BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE private.ticket_codigo_contadores (
  anio integer PRIMARY KEY CHECK (anio BETWEEN 2000 AND 9999),
  ultimo_numero bigint NOT NULL CHECK (ultimo_numero >= 1)
);

ALTER TABLE private.ticket_codigo_contadores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ticket_codigo_contadores FROM PUBLIC, anon, authenticated;

LOCK TABLE public.tickets IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.tickets DISABLE TRIGGER USER;

WITH temporales AS (
  SELECT
    id,
    row_number() OVER (ORDER BY id) AS numero
  FROM public.tickets
)
UPDATE public.tickets ticket
SET codigo = 'TMP-' || lpad(temporales.numero::text, 26, '0')
FROM temporales
WHERE ticket.id = temporales.id;

WITH numerados AS (
  SELECT
    id,
    extract(
      year FROM created_at AT TIME ZONE 'America/Lima'
    )::integer AS anio,
    row_number() OVER (
      PARTITION BY extract(
        year FROM created_at AT TIME ZONE 'America/Lima'
      )
      ORDER BY created_at, id
    ) AS numero
  FROM public.tickets
)
UPDATE public.tickets ticket
SET codigo =
  'ST-' || numerados.anio::text || '-' || lpad(numerados.numero::text, 6, '0')
FROM numerados
WHERE ticket.id = numerados.id;

ALTER TABLE public.tickets ENABLE TRIGGER USER;

INSERT INTO private.ticket_codigo_contadores (anio, ultimo_numero)
SELECT
  extract(
    year FROM created_at AT TIME ZONE 'America/Lima'
  )::integer AS anio,
  count(*)::bigint AS ultimo_numero
FROM public.tickets
GROUP BY 1;

CREATE OR REPLACE FUNCTION public.generar_codigo_ticket()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  anio_actual integer;
  numero bigint;
BEGIN
  anio_actual := extract(
    year FROM clock_timestamp() AT TIME ZONE 'America/Lima'
  )::integer;

  INSERT INTO private.ticket_codigo_contadores AS contador (
    anio,
    ultimo_numero
  )
  VALUES (anio_actual, 1)
  ON CONFLICT (anio) DO UPDATE
  SET ultimo_numero = contador.ultimo_numero + 1
  RETURNING ultimo_numero INTO numero;

  IF numero > 999999 THEN
    RAISE EXCEPTION 'Se agotó la numeración de tickets para el año %', anio_actual;
  END IF;

  RETURN
    'ST-' ||
    anio_actual::text ||
    '-' ||
    lpad(numero::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generar_codigo_ticket()
FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.generar_codigo_ticket() TO service_role;

DROP SEQUENCE public.ticket_codigo_seq;

COMMIT;

NOTIFY pgrst, 'reload schema';
