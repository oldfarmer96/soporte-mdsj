BEGIN;

DROP POLICY IF EXISTS usuarios_registrar_archivos ON public.ticket_archivos;
CREATE POLICY usuarios_registrar_archivos
ON public.ticket_archivos
FOR INSERT
TO authenticated
WITH CHECK (
  subido_por = (SELECT auth.uid())
  AND public.es_solicitante()
  AND public.es_propietario_ticket(id_ticket)
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_archivos.id_ticket
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
  )
);

DROP POLICY IF EXISTS subir_archivo_ticket_propio ON storage.objects;
CREATE POLICY subir_archivo_ticket_propio
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-archivos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND public.es_solicitante()
  AND public.es_propietario_ticket(
    ((storage.foldername(name))[2])::uuid
  )
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ((storage.foldername(name))[2])::uuid
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
  )
);

DROP POLICY IF EXISTS usuarios_eliminar_imagen_ticket ON public.ticket_archivos;
CREATE POLICY usuarios_eliminar_imagen_ticket
ON public.ticket_archivos
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_archivos.id_ticket
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
      AND (
        (
          tickets.id_solicitante = (SELECT auth.uid())
          AND ticket_archivos.subido_por = (SELECT auth.uid())
          AND public.es_solicitante()
          AND public.es_propietario_ticket(tickets.id)
        )
        OR (
          tickets.asignado_a = (SELECT auth.uid())
          AND public.es_apoyo_operativo()
        )
      )
  )
)
WITH CHECK (
  deleted_at IS NOT NULL
  AND eliminado_por = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_archivos.id_ticket
      AND tickets.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
      AND (
        (
          tickets.id_solicitante = (SELECT auth.uid())
          AND ticket_archivos.subido_por = (SELECT auth.uid())
          AND public.es_solicitante()
          AND public.es_propietario_ticket(tickets.id)
        )
        OR (
          tickets.asignado_a = (SELECT auth.uid())
          AND public.es_apoyo_operativo()
        )
      )
  )
);

DROP POLICY IF EXISTS eliminar_imagen_ticket_activo ON storage.objects;
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
    OR EXISTS (
      SELECT 1
      FROM public.ticket_archivos AS archivo
      JOIN public.tickets AS ticket ON ticket.id = archivo.id_ticket
      WHERE archivo.path = storage.objects.name
        AND archivo.bucket = storage.objects.bucket_id
        AND archivo.deleted_at IS NULL
        AND ticket.estado IN ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'REABIERTO')
        AND (
          (
            ticket.id_solicitante = (SELECT auth.uid())
            AND archivo.subido_por = (SELECT auth.uid())
            AND public.es_solicitante()
            AND public.es_propietario_ticket(ticket.id)
          )
          OR (
            ticket.asignado_a = (SELECT auth.uid())
            AND public.es_apoyo_operativo()
          )
        )
    )
  )
);

COMMIT;
