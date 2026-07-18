import type {
  TicketEventType,
  TicketHistoryEvent,
} from "@/shared/interfaces/ticket.interface";
import {
  Check,
  CircleDot,
  MessageSquare,
  RefreshCw,
  UserCheck,
  Wrench,
} from "lucide-react";
import { TicketPriorityBadge, TicketStatusBadge } from "./TicketBadges";

const EVENT_LABELS: Record<TicketEventType, string> = {
  CREACION: "Ticket registrado",
  ASIGNACION: "Personal asignado",
  REASIGNACION: "Asignación actualizada",
  CAMBIO_ESTADO: "Estado actualizado",
  CAMBIO_PRIORIDAD: "Prioridad actualizada",
  RESOLUCION: "Solución registrada",
  CIERRE: "Ticket cerrado",
  REAPERTURA: "Ticket reabierto",
  COMENTARIO: "Comentario agregado",
};

const EVENT_ICONS = {
  CREACION: CircleDot,
  ASIGNACION: UserCheck,
  REASIGNACION: UserCheck,
  CAMBIO_ESTADO: RefreshCw,
  CAMBIO_PRIORIDAD: RefreshCw,
  RESOLUCION: Wrench,
  CIERRE: Check,
  REAPERTURA: RefreshCw,
  COMENTARIO: MessageSquare,
} satisfies Record<TicketEventType, typeof CircleDot>;

const timelineDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const TicketTimeline = ({ history }: { history: TicketHistoryEvent[] }) => (
  <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
    <h2 className="text-lg font-black">Historial</h2>
    <p className="mt-1 text-sm text-base-content/60">
      Seguimiento de los cambios realizados en la solicitud.
    </p>

    {history.length === 0 ? (
      <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/60">
        Todavía no hay eventos registrados.
      </p>
    ) : (
      <ol className="timeline timeline-compact timeline-vertical mt-6">
        {history.map((event, index) => {
          const Icon = EVENT_ICONS[event.type];
          return (
            <li key={event.id}>
              {index > 0 && <hr className="bg-base-300" />}
              <div className="timeline-middle">
                <span className="grid size-8 place-items-center rounded-full bg-base-200">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <div className="timeline-end timeline-box mb-5 w-full border-base-300 bg-base-100 shadow-none">
                <time className="text-xs font-semibold text-base-content/50" dateTime={event.createdAt}>
                  {timelineDateFormatter.format(new Date(event.createdAt))}
                </time>
                <h3 className="mt-1 font-black">{EVENT_LABELS[event.type]}</h3>
                {event.detail && event.detail !== "Ticket creado" && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/65">
                    {event.detail}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.newStatus && <TicketStatusBadge status={event.newStatus} />}
                  {event.newPriority && (
                    <TicketPriorityBadge priority={event.newPriority} />
                  )}
                </div>
              </div>
              {index < history.length - 1 && <hr className="bg-base-300" />}
            </li>
          );
        })}
      </ol>
    )}
  </section>
);

export default TicketTimeline;
