DROP POLICY usuarios_registrar_archivos ON public.ticket_archivos;
CREATE POLICY usuarios_registrar_archivos
ON public.ticket_archivos
FOR INSERT
TO authenticated
WITH CHECK (
  subido_por = (SELECT auth.uid())
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

DROP POLICY subir_archivo_ticket_propio ON storage.objects;
CREATE POLICY subir_archivo_ticket_propio
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-archivos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
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

DROP POLICY eliminar_imagen_ticket_activo ON storage.objects;
CREATE POLICY eliminar_imagen_ticket_activo
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND (
    (
      owner_id = (SELECT auth.uid())::text
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      AND NOT EXISTS (
        SELECT 1
        FROM public.ticket_archivos AS archivo
        WHERE archivo.path = storage.objects.name
          AND archivo.deleted_at IS NULL
      )
    )
    OR (
      (
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
    )
  )
);
