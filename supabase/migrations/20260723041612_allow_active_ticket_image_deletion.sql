ALTER TABLE public.ticket_archivos
ADD COLUMN eliminado_por uuid
  REFERENCES public.perfiles(id)
  ON DELETE SET NULL;

GRANT UPDATE (deleted_at, eliminado_por)
ON public.ticket_archivos
TO authenticated;

CREATE POLICY usuarios_eliminar_imagen_ticket
ON public.ticket_archivos
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    public.es_propietario_ticket(id_ticket)
    OR public.es_apoyo_operativo()
  )
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_archivos.id_ticket
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
  )
)
WITH CHECK (
  deleted_at IS NOT NULL
  AND eliminado_por = (SELECT auth.uid())
  AND (
    public.es_propietario_ticket(id_ticket)
    OR public.es_apoyo_operativo()
  )
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_archivos.id_ticket
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
  )
);

DROP POLICY limpiar_subida_archivo_propia ON storage.objects;
CREATE POLICY eliminar_imagen_ticket_activo
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND (
    public.es_propietario_ticket(
      ((storage.foldername(name))[2])::uuid
    )
    OR public.es_apoyo_operativo()
  )
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ((storage.foldername(name))[2])::uuid
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
  )
);
