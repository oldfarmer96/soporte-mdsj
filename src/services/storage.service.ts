import type { TicketAttachment } from "@/shared/interfaces/ticket.interface";
import { supabase } from "@/shared/utils/supabase";
import imageCompressionWorkerUrl from "browser-image-compression/dist/browser-image-compression.js?url";

const BUCKET = "ticket-archivos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_SOURCE_FILE_SIZE = 30 * 1024 * 1024;
const COMPRESSION_THRESHOLD = 0.5 * 1024 * 1024;
const COMPRESSION_TARGET_MB = 4.5;
const SIGNED_URL_SECONDS = 5 * 60;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

interface AttachmentRow {
  id: string;
  bucket: string;
  path: string;
  nombre_original: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface UploadTicketAttachmentInput {
  ticketId: string;
  file: File;
  uploadId: string;
  onProgress?: (progress: number) => void;
}

export interface DeleteTicketAttachmentInput {
  ticketId: string;
  attachment: TicketAttachment;
}

export interface PreparedTicketAttachment {
  file: File;
  originalSizeBytes: number;
  wasOptimized: boolean;
}

const mapAttachment = (attachment: AttachmentRow): TicketAttachment => ({
  id: attachment.id,
  bucket: attachment.bucket,
  path: attachment.path,
  originalName: attachment.nombre_original,
  mimeType: attachment.mime_type,
  sizeBytes: attachment.size_bytes,
  createdAt: attachment.created_at,
});

export const validateTicketAttachment = (file: File): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return "Selecciona una imagen JPEG, PNG o WebP.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_FILE_SIZE) {
    return "No pudimos preparar la imagen para subirla. Intenta con otra fotografía.";
  }
  if (file.name.length > 255) return "El nombre del archivo es demasiado largo.";
  return null;
};

const validateTicketAttachmentSource = (file: File): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return "Selecciona una imagen JPEG, PNG o WebP.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_SOURCE_FILE_SIZE) {
    return "La imagen original supera el límite de 30 MB.";
  }
  return null;
};

const getFileExtension = (fileType: string) => {
  if (fileType === "image/jpeg") return "jpg";
  if (fileType === "image/png") return "png";
  return "webp";
};

const createAttachmentName = (
  ticketId: string,
  uploadId: string,
  fileType: string,
) => {
  const ticketReference = ticketId.replaceAll("-", "").slice(0, 8);
  const randomReference = uploadId.replaceAll("-", "").slice(0, 10);
  return `evidencia-${ticketReference}-${randomReference}.${getFileExtension(fileType)}`;
};

export const prepareTicketAttachment = async (
  sourceFile: File,
  ticketId: string,
  uploadId: string,
  onProgress?: (progress: number) => void,
): Promise<PreparedTicketAttachment> => {
  const sourceValidationError = validateTicketAttachmentSource(sourceFile);
  if (sourceValidationError) throw new Error(sourceValidationError);

  let preparedFile = sourceFile;
  let wasOptimized = false;

  if (sourceFile.size > COMPRESSION_THRESHOLD) {
    try {
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );
      preparedFile = await imageCompression(sourceFile, {
        maxSizeMB: COMPRESSION_TARGET_MB,
        maxWidthOrHeight: 1920,
        initialQuality: 0.85,
        fileType: "image/jpeg",
        useWebWorker: true,
        libURL: imageCompressionWorkerUrl,
        onProgress,
      });
      wasOptimized = true;
    } catch {
      throw new Error(
        "No pudimos optimizar la imagen. Intenta con otra fotografía.",
      );
    }
  }

  const file = new File(
    [preparedFile],
    createAttachmentName(ticketId, uploadId, preparedFile.type),
    {
      type: preparedFile.type,
      lastModified: Date.now(),
    },
  );
  const validationError = validateTicketAttachment(file);
  if (validationError) {
    throw new Error(
      file.size > MAX_FILE_SIZE
        ? "No pudimos optimizar la imagen. Intenta con otra fotografía."
        : validationError,
    );
  }

  return {
    file,
    originalSizeBytes: sourceFile.size,
    wasOptimized,
  };
};

const findAttachmentByPath = async (path: string): Promise<TicketAttachment | null> => {
  const { data, error } = await supabase
    .from("ticket_archivos")
    .select("id, bucket, path, nombre_original, mime_type, size_bytes, created_at")
    .eq("path", path)
    .maybeSingle();

  if (error) throw error;
  return data ? mapAttachment(data as AttachmentRow) : null;
};

export const uploadTicketAttachment = async ({
  ticketId,
  file,
  uploadId,
  onProgress,
}: UploadTicketAttachmentInput): Promise<TicketAttachment> => {
  const validationError = validateTicketAttachment(file);
  if (validationError) throw new Error(validationError);
  onProgress?.(10);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Debes iniciar sesión para subir archivos.");

  const path = `${authData.user.id}/${ticketId}/${uploadId}.${getFileExtension(file.type)}`;
  const existingAttachment = await findAttachmentByPath(path);
  if (existingAttachment) {
    onProgress?.(100);
    return existingAttachment;
  }

  onProgress?.(25);
  let uploadResult = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (
    uploadResult.error &&
    /already exists|duplicate|resource exists/i.test(uploadResult.error.message)
  ) {
    const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]);
    if (!cleanupError) {
      uploadResult = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
    }
  }

  if (uploadResult.error) throw uploadResult.error;
  onProgress?.(75);

  const { data: metadata, error: metadataError } = await supabase
    .from("ticket_archivos")
    .insert({
      id_ticket: ticketId,
      subido_por: authData.user.id,
      bucket: BUCKET,
      path,
      nombre_original: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("id, bucket, path, nombre_original, mime_type, size_bytes, created_at")
    .single();

  if (metadataError) {
    const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]);
    if (cleanupError) {
      throw new Error(
        "No se registró el archivo y tampoco fue posible limpiar la carga incompleta.",
      );
    }
    throw metadataError;
  }

  onProgress?.(100);
  return mapAttachment(metadata as AttachmentRow);
};

export const createAttachmentSignedUrl = async (attachment: TicketAttachment) => {
  const { data, error } = await supabase.storage
    .from(attachment.bucket)
    .createSignedUrl(attachment.path, SIGNED_URL_SECONDS);

  if (error) throw error;
  return data.signedUrl;
};

export const deleteTicketAttachment = async ({
  ticketId,
  attachment,
}: DeleteTicketAttachmentInput) => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Debes iniciar sesión para eliminar la imagen.");

  const { error: storageError } = await supabase.storage
    .from(attachment.bucket)
    .remove([attachment.path]);
  if (storageError) throw storageError;

  const { error: metadataError } = await supabase
    .from("ticket_archivos")
    .update({
      deleted_at: new Date().toISOString(),
      eliminado_por: authData.user.id,
    })
    .eq("id", attachment.id)
    .eq("id_ticket", ticketId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (metadataError) {
    throw new Error(
      "La imagen se eliminó del almacenamiento, pero no pudimos actualizar el ticket. Vuelve a intentarlo.",
    );
  }
};

export const getDeleteAttachmentErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("almacenamiento")) return message;
  if (
    message.includes("row-level security") ||
    message.includes("not authorized") ||
    message.includes("0 rows")
  ) {
    return "No puedes eliminar la imagen de este ticket o su estado ya no lo permite.";
  }
  if (message.includes("iniciar sesión")) return message;

  return "No pudimos eliminar la imagen. Vuelve a intentarlo.";
};

export const getStorageErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("JPEG")) return message;
  if (message.includes("row-level security") || message.includes("not authorized")) {
    return "No tienes permiso para subir archivos a este ticket.";
  }
  if (message.includes("ticket_archivos_un_archivo_activo_por_ticket_idx")) {
    return "Este ticket ya tiene una imagen asociada.";
  }
  if (message.includes("limpiar la carga")) return message;

  return "No pudimos subir la imagen. Puedes volver a intentarlo.";
};
