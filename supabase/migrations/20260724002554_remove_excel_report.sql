BEGIN;

DROP FUNCTION IF EXISTS public.obtener_detalle_reporte_soporte(date, date);

COMMIT;

NOTIFY pgrst, 'reload schema';
