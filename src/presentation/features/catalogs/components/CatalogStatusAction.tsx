import { AlertTriangle, Power, PowerOff, X } from "lucide-react";
import { useState } from "react";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

interface CatalogStatusActionProps {
  id: string;
  name: string;
  isActive: boolean;
  onConfirm: () => Promise<unknown>;
}

const CatalogStatusAction = ({
  id,
  name,
  isActive,
  onConfirm,
}: CatalogStatusActionProps) => {
  const [isPending, setIsPending] = useState(false);
  const dialogId = `catalog-status-${id}`;

  const confirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      getDialog(dialogId)?.close();
    } catch {
      // The mutation displays the domain error and keeps the dialog open.
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-sm ${isActive ? "btn-error btn-outline" : ""}`}
        onClick={() => getDialog(dialogId)?.showModal()}
      >
        {isActive ? (
          <PowerOff className="size-4" aria-hidden="true" />
        ) : (
          <Power className="size-4" aria-hidden="true" />
        )}
        {isActive ? "Desactivar" : "Activar"}
      </button>

      <dialog id={dialogId} className="modal">
        <div className="modal-box">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {isActive ? "Desactivar registro" : "Activar registro"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                {isActive
                  ? `${name} dejará de aparecer en formularios nuevos. Los tickets históricos no se modificarán.`
                  : `${name} volverá a estar disponible para nuevos tickets.`}
              </p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          {isActive && (
            <div className="alert alert-warning alert-soft mt-5 items-start">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <span>Confirma que este registro ya no debe usarse en nuevas solicitudes.</span>
            </div>
          )}
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => getDialog(dialogId)?.close()}>
              Cancelar
            </button>
            <button
              type="button"
              className={isActive ? "btn btn-error" : "btn btn-primary"}
              disabled={isPending}
              onClick={confirm}
            >
              {isPending && <span className="loading loading-spinner loading-sm" />}
              {isActive ? "Confirmar desactivación" : "Confirmar activación"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </>
  );
};

export default CatalogStatusAction;
