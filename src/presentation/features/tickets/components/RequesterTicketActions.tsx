import {
  useConfirmTicketSolution,
  useReopenTicket,
} from "@/application/hooks/useTickets";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { TicketDetail } from "@/shared/interfaces/ticket.interface";
import { getRequesterActionErrorMessage } from "@/services/ticket.service";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ThumbsDown,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  rejectSolutionSchema,
  reopenTicketSchema,
  type RejectSolutionForm,
  type ReopenTicketForm,
} from "../schemas/requesterTicketActions.schema";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const RequesterTicketActions = ({ ticket }: { ticket: TicketDetail }) => {
  const confirmMutation = useConfirmTicketSolution();
  const reopenMutation = useReopenTicket();
  const rejectForm = useForm<RejectSolutionForm>({
    resolver: zodResolver(rejectSolutionSchema),
    defaultValues: { reason: "" },
  });
  const reopenForm = useForm<ReopenTicketForm>({
    resolver: zodResolver(reopenTicketSchema),
    defaultValues: { reason: "" },
  });
  const confirmDialogId = `confirm-solution-${ticket.id}`;
  const rejectDialogId = `reject-solution-${ticket.id}`;
  const reopenDialogId = `reopen-ticket-${ticket.id}`;

  if (ticket.status !== "RESUELTO" && ticket.status !== "CERRADO") return null;

  const openDialog = (dialogId: string) => {
    confirmMutation.reset();
    reopenMutation.reset();
    getDialog(dialogId)?.showModal();
  };

  const confirmSolution = () => {
    confirmMutation.mutate(
      { ticketId: ticket.id, solved: true, comment: null },
      { onSuccess: () => getDialog(confirmDialogId)?.close() },
    );
  };

  const rejectSolution = (form: RejectSolutionForm) => {
    confirmMutation.mutate(
      { ticketId: ticket.id, solved: false, comment: form.reason },
      { onSuccess: () => getDialog(rejectDialogId)?.close() },
    );
  };

  const reopenTicket = (form: ReopenTicketForm) => {
    reopenMutation.mutate(
      { ticketId: ticket.id, reason: form.reason },
      { onSuccess: () => getDialog(reopenDialogId)?.close() },
    );
  };

  if (ticket.status === "RESUELTO") {
    if (!ticket.resolution) {
      return (
        <div className="alert alert-error alert-soft items-start" role="alert">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <p>El ticket figura como resuelto, pero no tiene una solución disponible para confirmar.</p>
        </div>
      );
    }

    return (
      <section className="rounded-box border border-warning/30 bg-warning/10 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-warning" aria-hidden="true" />
          <div className="grow">
            <h2 className="text-lg font-black">Confirma el resultado de la atención</h2>
            <p className="mt-2 text-sm leading-relaxed text-base-content/70">
              Revisa la solución registrada. Si el problema terminó, confirma para cerrar el
              ticket. Si continúa, explica qué sucede para reabrirlo.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={confirmMutation.isPending}
                onClick={() => openDialog(confirmDialogId)}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Sí, quedó resuelto
              </button>
              <button
                type="button"
                className="btn"
                disabled={confirmMutation.isPending}
                onClick={() => openDialog(rejectDialogId)}
              >
                <ThumbsDown className="size-4" aria-hidden="true" />
                El problema continúa
              </button>
            </div>
          </div>
        </div>

        <dialog id={confirmDialogId} className="modal">
          <div className="modal-box">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Confirmar solución</h2>
                <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                  El ticket pasará a cerrado. Podrás reabrirlo si el problema reaparece.
                </p>
              </div>
              <form method="dialog">
                <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </form>
            </div>
            {confirmMutation.isError && (
              <div className="alert alert-error alert-soft mt-5" role="alert">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <span>{getRequesterActionErrorMessage(confirmMutation.error)}</span>
              </div>
            )}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(confirmDialogId)?.close()}>
                Volver
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={confirmMutation.isPending}
                onClick={confirmSolution}
              >
                {confirmMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                Confirmar y cerrar
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
        </dialog>

        <dialog id={rejectDialogId} className="modal">
          <div className="modal-box">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">El problema continúa</h2>
                <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                  El ticket volverá a la cola para que el personal de apoyo continúe la atención.
                </p>
              </div>
              <form method="dialog">
                <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </form>
            </div>
            <form className="mt-5" onSubmit={rejectForm.handleSubmit(rejectSolution)} noValidate>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">¿Qué problema continúa?</legend>
                <textarea
                  {...rejectForm.register("reason")}
                  className={`textarea min-h-32 w-full ${
                    rejectForm.formState.errors.reason ? "textarea-error" : ""
                  }`}
                  maxLength={1000}
                  placeholder="Describe qué sigue fallando o qué resultado esperabas"
                  aria-invalid={Boolean(rejectForm.formState.errors.reason)}
                  aria-describedby={
                    rejectForm.formState.errors.reason ? "reject-solution-error" : undefined
                  }
                />
                <FieldInfo
                  id="reject-solution-error"
                  error={rejectForm.formState.errors.reason}
                />
              </fieldset>
              {confirmMutation.isError && (
                <div className="alert alert-error alert-soft mt-4" role="alert">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                  <span>{getRequesterActionErrorMessage(confirmMutation.error)}</span>
                </div>
              )}
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => getDialog(rejectDialogId)?.close()}>
                  Volver
                </button>
                <button type="submit" className="btn btn-warning" disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                  Reabrir atención
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
        </dialog>
      </section>
    );
  }

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black">¿El problema reapareció?</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/65">
            Reabre el ticket únicamente si se trata del mismo problema. Para una incidencia
            diferente, registra un ticket nuevo.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          disabled={reopenMutation.isPending}
          onClick={() => openDialog(reopenDialogId)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reabrir ticket
        </button>
      </div>

      <dialog id={reopenDialogId} className="modal">
        <div className="modal-box">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Reabrir ticket cerrado</h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                La solicitud volverá a la cola sin personal asignado.
              </p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <form className="mt-5" onSubmit={reopenForm.handleSubmit(reopenTicket)} noValidate>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Motivo de reapertura</legend>
              <textarea
                {...reopenForm.register("reason")}
                className={`textarea min-h-32 w-full ${
                  reopenForm.formState.errors.reason ? "textarea-error" : ""
                }`}
                maxLength={1000}
                placeholder="Explica cuándo reapareció y qué está ocurriendo"
                aria-invalid={Boolean(reopenForm.formState.errors.reason)}
                aria-describedby={
                  reopenForm.formState.errors.reason ? "reopen-ticket-error" : undefined
                }
              />
              <FieldInfo id="reopen-ticket-error" error={reopenForm.formState.errors.reason} />
            </fieldset>
            {reopenMutation.isError && (
              <div className="alert alert-error alert-soft mt-4" role="alert">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <span>{getRequesterActionErrorMessage(reopenMutation.error)}</span>
              </div>
            )}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(reopenDialogId)?.close()}>
                Volver
              </button>
              <button type="submit" className="btn btn-warning" disabled={reopenMutation.isPending}>
                {reopenMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                Confirmar reapertura
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </section>
  );
};

export default RequesterTicketActions;
