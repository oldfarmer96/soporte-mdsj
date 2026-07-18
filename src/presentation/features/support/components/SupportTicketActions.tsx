import {
  useAssignSupportTicket,
  useChangeSupportTicketState,
  useResolveSupportTicket,
  useSupportAgents,
} from "@/application/hooks/useSupportTickets";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { SupportTicketDetail } from "@/shared/interfaces/supportTicket.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCircle2, Play, UserCheck, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  cancelTicketSchema,
  resolveTicketSchema,
  type CancelTicketForm,
  type ResolveTicketForm,
} from "../schemas/supportTicket.schema";

const ASSIGNABLE_STATES = ["NUEVO", "ASIGNADO", "EN_CURSO", "REABIERTO"];
const STARTABLE_STATES = ["ASIGNADO", "REABIERTO"];
const RESOLVABLE_STATES = ["ASIGNADO", "EN_CURSO", "REABIERTO"];
const CANCELLABLE_STATES = ["NUEVO", "ASIGNADO", "EN_CURSO", "REABIERTO"];
const CANCEL_DIALOG_ID = "cancel-support-ticket-dialog";
const RESOLVE_DIALOG_ID = "resolve-support-ticket-dialog";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const SupportTicketActions = ({ ticket }: { ticket: SupportTicketDetail }) => {
  const agentsQuery = useSupportAgents();
  const assignMutation = useAssignSupportTicket();
  const stateMutation = useChangeSupportTicketState();
  const resolveMutation = useResolveSupportTicket();
  const cancelForm = useForm<CancelTicketForm>({
    resolver: zodResolver(cancelTicketSchema),
    defaultValues: { detail: "" },
  });
  const resolveForm = useForm<ResolveTicketForm>({
    resolver: zodResolver(resolveTicketSchema),
    defaultValues: { diagnosis: "", solution: "" },
  });
  const isMutating =
    assignMutation.isPending || stateMutation.isPending || resolveMutation.isPending;
  const canAssign = ASSIGNABLE_STATES.includes(ticket.status);
  const canStart = STARTABLE_STATES.includes(ticket.status);
  const canResolve = RESOLVABLE_STATES.includes(ticket.status);
  const canCancel = CANCELLABLE_STATES.includes(ticket.status);

  const assignTicket = (formData: FormData) => {
    const agentId = String(formData.get("agentId") ?? "");
    if (!agentId) return;
    assignMutation.mutate({ ticketId: ticket.id, agentId });
  };

  const cancelTicket = (form: CancelTicketForm) => {
    stateMutation.mutate(
      { ticketId: ticket.id, status: "CANCELADO", detail: form.detail },
      { onSuccess: () => getDialog(CANCEL_DIALOG_ID)?.close() },
    );
  };

  const resolveTicket = (form: ResolveTicketForm) => {
    resolveMutation.mutate(
      {
        ticketId: ticket.id,
        diagnosis: form.diagnosis,
        solution: form.solution,
      },
      { onSuccess: () => getDialog(RESOLVE_DIALOG_ID)?.close() },
    );
  };

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black">Operación</h2>
      <p className="mt-1 text-sm text-base-content/60">
        Solo se muestran las acciones válidas para el estado actual.
      </p>

      {canAssign && (
        <form action={assignTicket} className="mt-5 rounded-box bg-base-200 p-4">
          <label htmlFor="support-agent" className="text-sm font-bold">
            Asignar personal
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              key={ticket.assignedAgent?.id ?? "unassigned"}
              id="support-agent"
              name="agentId"
              className="select w-full"
              defaultValue={ticket.assignedAgent?.id ?? ""}
              disabled={agentsQuery.isPending || agentsQuery.isError || isMutating}
              required
            >
              <option value="" disabled>
                {agentsQuery.isPending ? "Cargando personal..." : "Selecciona una persona"}
              </option>
              {agentsQuery.data?.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.role === "ADMIN" ? "Admin" : "Apoyo"}
                </option>
              ))}
            </select>
            <button type="submit" className="btn" disabled={isMutating || agentsQuery.isError}>
              {assignMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <UserCheck className="size-4" aria-hidden="true" />
              )}
              Guardar
            </button>
          </div>
          {agentsQuery.isError && (
            <p className="mt-2 text-sm text-error">No pudimos cargar el personal disponible.</p>
          )}
        </form>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {canStart && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isMutating}
            onClick={() =>
              stateMutation.mutate({ ticketId: ticket.id, status: "EN_CURSO" })
            }
          >
            {stateMutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            Iniciar atención
          </button>
        )}
        {canResolve && (
          <button
            type="button"
            className="btn"
            disabled={isMutating}
            onClick={() => getDialog(RESOLVE_DIALOG_ID)?.showModal()}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Registrar solución
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className="btn btn-error btn-outline sm:col-span-2"
            disabled={isMutating}
            onClick={() => getDialog(CANCEL_DIALOG_ID)?.showModal()}
          >
            <Ban className="size-4" aria-hidden="true" />
            Cancelar ticket
          </button>
        )}
      </div>

      {!canAssign && !canStart && !canResolve && !canCancel && (
        <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
          Este ticket no admite acciones operativas desde su estado actual.
        </p>
      )}

      <dialog id={CANCEL_DIALOG_ID} className="modal">
        <div className="modal-box">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Cancelar ticket</h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                Esta acción detiene la atención y no puede revertirse con las reglas actuales.
              </p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <form className="mt-5" onSubmit={cancelForm.handleSubmit(cancelTicket)} noValidate>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Motivo <span className="font-normal opacity-55">(opcional)</span>
              </legend>
              <textarea
                {...cancelForm.register("detail")}
                className={`textarea min-h-28 w-full ${
                  cancelForm.formState.errors.detail ? "textarea-error" : ""
                }`}
                maxLength={1000}
                placeholder="Explica por qué se cancela la solicitud"
                aria-invalid={Boolean(cancelForm.formState.errors.detail)}
                aria-describedby={
                  cancelForm.formState.errors.detail ? "cancel-detail-error" : undefined
                }
              />
              <FieldInfo id="cancel-detail-error" error={cancelForm.formState.errors.detail} />
            </fieldset>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(CANCEL_DIALOG_ID)?.close()}>
                Volver
              </button>
              <button type="submit" className="btn btn-error" disabled={stateMutation.isPending}>
                {stateMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                Confirmar cancelación
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>

      <dialog id={RESOLVE_DIALOG_ID} className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Registrar solución</h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                El ticket pasará a resuelto y quedará pendiente de confirmación del solicitante.
              </p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <form className="mt-5 space-y-4" onSubmit={resolveForm.handleSubmit(resolveTicket)} noValidate>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Diagnóstico <span className="font-normal opacity-55">(opcional)</span>
              </legend>
              <textarea
                {...resolveForm.register("diagnosis")}
                className={`textarea min-h-28 w-full ${
                  resolveForm.formState.errors.diagnosis ? "textarea-error" : ""
                }`}
                maxLength={3000}
                placeholder="Causa identificada del problema"
                aria-invalid={Boolean(resolveForm.formState.errors.diagnosis)}
              />
              <FieldInfo
                id="resolve-diagnosis-error"
                error={resolveForm.formState.errors.diagnosis}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Solución aplicada</legend>
              <textarea
                {...resolveForm.register("solution")}
                className={`textarea min-h-36 w-full ${
                  resolveForm.formState.errors.solution ? "textarea-error" : ""
                }`}
                maxLength={3000}
                placeholder="Describe claramente cómo se resolvió"
                aria-invalid={Boolean(resolveForm.formState.errors.solution)}
                aria-describedby={
                  resolveForm.formState.errors.solution ? "resolve-solution-error" : undefined
                }
              />
              <FieldInfo
                id="resolve-solution-error"
                error={resolveForm.formState.errors.solution}
              />
            </fieldset>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(RESOLVE_DIALOG_ID)?.close()}>
                Volver
              </button>
              <button type="submit" className="btn btn-primary" disabled={resolveMutation.isPending}>
                {resolveMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                Marcar como resuelto
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </section>
  );
};

export default SupportTicketActions;
