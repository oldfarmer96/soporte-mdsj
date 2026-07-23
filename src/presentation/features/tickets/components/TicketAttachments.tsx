import {
  useAttachmentSignedUrl,
  useDeleteTicketAttachment,
  useUploadTicketAttachment,
} from "@/application/hooks/useStorage";
import type {
  TicketAttachment,
  TicketStatus,
} from "@/shared/interfaces/ticket.interface";
import {
  getDeleteAttachmentErrorMessage,
  getStorageErrorMessage,
  prepareTicketAttachment,
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
const DELETABLE_STATUSES: TicketStatus[] = [
  "NUEVO",
  "ASIGNADO",
  "EN_CURSO",
  "REABIERTO",
];

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  originalSizeBytes: number;
  wasOptimized: boolean;
  error?: string;
}

const formatFileSize = (sizeBytes: number | null) => {
  if (sizeBytes === null) return "Tamaño no disponible";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
};

const AttachmentPreview = ({
  attachment,
  ticketId,
  canDelete,
}: {
  attachment: TicketAttachment;
  ticketId: string;
  canDelete: boolean;
}) => {
  const signedUrlQuery = useAttachmentSignedUrl(attachment);
  const deleteMutation = useDeleteTicketAttachment();
  const deleteDialogId = `delete-attachment-${attachment.id}`;

  const openDeleteDialog = () => {
    deleteMutation.reset();
    getDialog(deleteDialogId)?.showModal();
  };

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
        {canDelete && (
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm shrink-0 text-error"
            aria-label="Eliminar imagen"
            onClick={openDeleteDialog}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {canDelete && (
        <dialog id={deleteDialogId} className="modal">
          <div className="modal-box">
            <span className="grid size-12 place-items-center rounded-2xl bg-error/10 text-error">
              <Trash2 className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-black">Eliminar imagen</h3>
            <p className="mt-2 leading-relaxed text-base-content/65">
              La imagen se eliminará del ticket. Después podrás seleccionar y
              subir otra evidencia.
            </p>

            {deleteMutation.isError && (
              <div className="alert alert-error alert-soft mt-5" role="alert">
                <span>
                  {getDeleteAttachmentErrorMessage(deleteMutation.error)}
                </span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                disabled={deleteMutation.isPending}
                onClick={() => getDialog(deleteDialogId)?.close()}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(
                    { ticketId, attachment },
                    { onSuccess: () => getDialog(deleteDialogId)?.close() },
                  )
                }
              >
                {deleteMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar imagen"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button disabled={deleteMutation.isPending}>Cerrar</button>
          </form>
        </dialog>
      )}
    </li>
  );
};

const TicketAttachments = ({
  ticketId,
  attachments,
  status,
}: {
  ticketId: string;
  attachments: TicketAttachment[];
  status: TicketStatus;
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const uploadMutation = useUploadTicketAttachment();
  const isUploading = uploads.some((item) => item.status === "uploading");
  const isProcessing = isOptimizing || isUploading;
  const canModify = DELETABLE_STATUSES.includes(status);

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
          <h2 className="text-lg font-black">Imagen</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Una evidencia JPEG, PNG o WebP de hasta 5 MB.
          </p>
        </div>
      </div>

      {attachments.length === 0 && canModify ? (
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
            disabled={isProcessing}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (!file) {
                setUploads([]);
                return;
              }

              const uploadId = crypto.randomUUID();
              setUploads([]);
              setSelectionError(null);
              setOptimizationProgress(0);
              setIsOptimizing(true);

              try {
                const prepared = await prepareTicketAttachment(
                  file,
                  ticketId,
                  uploadId,
                  setOptimizationProgress,
                );
                setUploads([
                  {
                    id: uploadId,
                    file: prepared.file,
                    status: "pending",
                    progress: 0,
                    originalSizeBytes: prepared.originalSizeBytes,
                    wasOptimized: prepared.wasOptimized,
                  },
                ]);
              } catch (error) {
                setSelectionError(
                  error instanceof Error
                    ? error.message
                    : "No pudimos procesar la imagen seleccionada.",
                );
              } finally {
                setIsOptimizing(false);
              }
            }}
          />
          <p className="mt-2 text-xs leading-relaxed text-base-content/55">
            Puedes elegir una imagen de hasta 30 MB. Las fotografías grandes se
            optimizan automáticamente antes de subirlas.
          </p>
          {isOptimizing && (
            <div className="mt-3" role="status">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span>Optimizando imagen...</span>
                <span>{Math.round(optimizationProgress)}%</span>
              </div>
              <progress
                className="progress progress-primary mt-2 w-full"
                value={optimizationProgress}
                max="100"
                aria-label={`Optimizando imagen: ${Math.round(optimizationProgress)}%`}
              />
            </div>
          )}
          {selectionError && (
            <p className="mt-3 wrap-break-word text-sm text-error" role="alert">
              {selectionError}
            </p>
          )}
        </div>
      ) : attachments.length > 0 ? (
        <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
          Este ticket ya tiene una imagen asociada.
        </p>
      ) : (
        <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
          Ya no se pueden agregar imágenes en el estado actual del ticket.
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
                      {item.wasOptimized
                        ? `Original ${formatFileSize(item.originalSizeBytes)} / Optimizada ${formatFileSize(item.file.size)}`
                        : formatFileSize(item.file.size)}
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
              disabled={isProcessing}
              onClick={() => {
                setUploads([]);
                setSelectionError(null);
              }}
            >
              Limpiar selección
            </button>
            {uploads.some(
              (item) => item.status === "pending" || item.status === "error",
            ) && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isProcessing}
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
          Este ticket no tiene una imagen asociada.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              ticketId={ticketId}
              canDelete={canModify}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default TicketAttachments;
