INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'ticket-archivos',
  'ticket-archivos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY subir_archivo_ticket_propio
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-archivos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND public.es_propietario_ticket(
    ((storage.foldername(name))[2])::uuid
  )
);

CREATE POLICY ver_archivo_ticket_propio
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND (
    public.es_propietario_ticket(
      ((storage.foldername(name))[2])::uuid
    )
    OR public.es_personal_apoyo()
  )
);

CREATE POLICY limpiar_subida_archivo_propia
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-archivos'
  AND owner_id = (SELECT auth.uid())::text
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND public.es_propietario_ticket(
    ((storage.foldername(name))[2])::uuid
  )
);
