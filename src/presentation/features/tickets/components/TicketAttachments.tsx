import {
  useAttachmentSignedUrl,
  useUploadTicketAttachment,
} from "@/application/hooks/useStorage";
import type { TicketAttachment } from "@/shared/interfaces/ticket.interface";
import {
  getStorageErrorMessage,
  validateTicketAttachment,
} from "@/services/storage.service";
import {
  CheckCircle2,
  ExternalLink,
  FileImage,
  ImagePlus,
  Paperclip,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type UploadStatus = "pending" | "uploading" | "success" | "error";

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const formatFileSize = (sizeBytes: number | null) => {
  if (sizeBytes === null) return "Tamaño no disponible";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
};

const AttachmentPreview = ({
  attachment,
}: {
  attachment: TicketAttachment;
}) => {
  const signedUrlQuery = useAttachmentSignedUrl(attachment);

  return (
    <li className="overflow-hidden rounded-box border border-base-300 bg-base-100">
      <div className="aspect-video bg-base-200">
        {signedUrlQuery.isPending && (
          <div className="skeleton h-full w-full rounded-none" />
        )}
        {signedUrlQuery.isError && (
          <div className="grid h-full place-items-center p-4 text-center">
            <div>
              <FileImage
                className="mx-auto size-7 text-base-content/40"
                aria-hidden="true"
              />
              <p className="mt-2 text-xs text-error">
                No pudimos abrir la vista previa.
              </p>
              <button
                type="button"
                className="btn btn-sm mt-3"
                onClick={() => signedUrlQuery.refetch()}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" /> Reintentar
              </button>
            </div>
          </div>
        )}
        {signedUrlQuery.isSuccess && (
          <a
            href={signedUrlQuery.data}
            target="_blank"
            rel="noreferrer"
            className="group relative block h-full"
            aria-label={`Abrir ${attachment.originalName ?? "imagen adjunta"}`}
          >
            <img
              src={signedUrlQuery.data}
              alt={attachment.originalName ?? "Evidencia adjunta al ticket"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-base-100/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ExternalLink className="size-4" aria-hidden="true" />
            </span>
          </a>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-3 p-4">
        <FileImage className="size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 grow">
          <p className="truncate text-sm font-bold">
            {attachment.originalName ?? "Imagen adjunta"}
          </p>
          <p className="mt-1 text-xs text-base-content/55">
            {formatFileSize(attachment.sizeBytes)}
          </p>
        </div>
      </div>
    </li>
  );
};

const TicketAttachments = ({
  ticketId,
  attachments,
}: {
  ticketId: string;
  attachments: TicketAttachment[];
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadMutation = useUploadTicketAttachment();
  const isUploading = uploads.some((item) => item.status === "uploading");

  const updateUpload = (uploadId: string, changes: Partial<UploadItem>) => {
    setUploads((current) =>
      current.map((item) =>
        item.id === uploadId ? { ...item, ...changes } : item,
      ),
    );
  };

  const uploadOne = async (item: UploadItem) => {
    const validationError = validateTicketAttachment(item.file);
    if (validationError) {
      updateUpload(item.id, {
        status: "error",
        progress: 0,
        error: validationError,
      });
      return;
    }

    updateUpload(item.id, {
      status: "uploading",
      progress: 10,
      error: undefined,
    });
    try {
      await uploadMutation.mutateAsync({
        ticketId,
        file: item.file,
        uploadId: item.id,
        onProgress: (progress) => updateUpload(item.id, { progress }),
      });
      updateUpload(item.id, { status: "success", progress: 100 });
    } catch (error) {
      updateUpload(item.id, {
        status: "error",
        progress: 0,
        error: getStorageErrorMessage(error),
      });
    }
  };

  const uploadAll = async () => {
    for (const item of uploads) {
      if (item.status === "pending" || item.status === "error")
        await uploadOne(item);
    }
  };

  return (
    <section className="min-w-0 max-w-full rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200">
          <Paperclip className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-black">Archivos</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Una evidencia JPEG, PNG o WebP de hasta 5 MB.
          </p>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-box border border-dashed border-base-300 bg-base-200 p-4">
          <label
            htmlFor={`ticket-files-${ticketId}`}
            className="text-sm font-bold"
          >
            Seleccionar imagen
          </label>
          <input
            id={`ticket-files-${ticketId}`}
            type="file"
            className="file-input file-input-primary mt-2 block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setUploads([]);
                return;
              }

              const error = validateTicketAttachment(file);
              setUploads([
                {
                  id: crypto.randomUUID(),
                  file,
                  status: error ? "error" : "pending",
                  progress: 0,
                  error: error ?? undefined,
                },
              ]);
              event.currentTarget.value = "";
            }}
          />
          <p className="mt-2 text-xs leading-relaxed text-base-content/55">
            En teléfonos puedes elegir la cámara o una imagen de la galería.
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
          Este ticket ya tiene una imagen asociada.
        </p>
      )}

      {uploads.length > 0 && (
        <div className="mt-4">
          <ul className="grid min-w-0 max-w-full gap-2">
            {uploads.map((item) => (
              <li
                key={item.id}
                className="min-w-0 max-w-full overflow-hidden rounded-box border border-base-300 p-3"
              >
                <div className="flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden">
                  {item.status === "success" ? (
                    <CheckCircle2
                      className="size-5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <ImagePlus
                      className="size-5 shrink-0 text-base-content/45"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 grow">
                    <p
                      className="block w-full min-w-0 truncate text-sm font-bold"
                      title={item.file.name}
                    >
                      {item.file.name}
                    </p>
                    <p className="mt-1 text-xs text-base-content/55">
                      {formatFileSize(item.file.size)}
                      {item.status === "success" ? " · Subido" : ""}
                    </p>
                  </div>
                  {item.status === "error" && !isUploading && (
                    <button
                      type="button"
                      className="btn btn-sm shrink-0"
                      onClick={() => uploadOne(item)}
                    >
                      <RefreshCw className="size-3.5" aria-hidden="true" />{" "}
                      Reintentar
                    </button>
                  )}
                  {item.status === "pending" && !isUploading && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-square btn-sm shrink-0"
                      aria-label={`Quitar ${item.file.name}`}
                      onClick={() =>
                        setUploads((current) =>
                          current.filter((upload) => upload.id !== item.id),
                        )
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {item.status === "uploading" && (
                  <progress
                    className="progress progress-primary mt-3 w-full"
                    value={item.progress}
                    max="100"
                    aria-label={`Subiendo ${item.file.name}: ${item.progress}%`}
                  />
                )}
                {item.error && (
                  <p className="mt-2 wrap-break-word text-xs text-error">
                    {item.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isUploading}
              onClick={() => setUploads([])}
            >
              Limpiar selección
            </button>
            {uploads.some(
              (item) => item.status === "pending" || item.status === "error",
            ) && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isUploading}
                onClick={uploadAll}
              >
                {isUploading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <ImagePlus className="size-4" aria-hidden="true" />
                )}
                {isUploading ? "Subiendo..." : "Subir imagen"}
              </button>
            )}
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
          Este ticket no tiene archivos asociados.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentPreview key={attachment.id} attachment={attachment} />
          ))}
        </ul>
      )}
    </section>
  );
};

export default TicketAttachments;
