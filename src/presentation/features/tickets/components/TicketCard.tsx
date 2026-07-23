import type { TicketListItem } from "@/shared/interfaces/ticket.interface";
import { CalendarDays, ChevronRight, MapPin, UserCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { TicketPriorityBadge, TicketStatusBadge } from "./TicketBadges";

const shortDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const TicketCard = ({ ticket }: { ticket: TicketListItem }) => (
  <li className="min-w-0 max-w-full">
    <Link
      to={`/tickets/${ticket.id}`}
      className="block w-full min-w-0 max-w-full rounded-box border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-base-content/50">
            {ticket.code}
          </p>
          <h2 className="mt-1 wrap-break-word text-base font-black">
            {ticket.subject}
          </h2>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-base-content/40"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <dl className="mt-4 grid gap-2 border-t border-base-300 pt-4 text-sm text-base-content/65">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[0.6875rem] font-bold uppercase tracking-wide text-base-content/45">
              Ubicación
            </dt>
            <dd className="min-w-0 wrap-break-word font-semibold">
              {ticket.areaName} · {ticket.subareaName}
            </dd>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <Wrench className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[0.6875rem] font-bold uppercase tracking-wide text-base-content/45">
              Problema
            </dt>
            <dd className="min-w-0 wrap-break-word text-xs font-semibold">
              {ticket.categoryName} · {ticket.problemTypeName}
            </dd>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Última actualización</dt>
          <dd className="min-w-0 wrap-break-word">
            Actualizado {shortDateFormatter.format(new Date(ticket.updatedAt))}
          </dd>
        </div>
        {ticket.isAssigned && (
          <div className="flex items-center gap-2 font-semibold">
            <UserCheck className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Asignación</dt>
            <dd>Personal de apoyo asignado</dd>
          </div>
        )}
      </dl>
    </Link>
  </li>
);

export default TicketCard;
