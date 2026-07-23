DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ticket_archivos
    WHERE deleted_at IS NULL
    GROUP BY id_ticket
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'No se puede limitar a una imagen: existen tickets con varios archivos activos.';
  END IF;
END
$$;

CREATE UNIQUE INDEX ticket_archivos_un_archivo_activo_por_ticket_idx
ON public.ticket_archivos (id_ticket)
WHERE deleted_at IS NULL;
