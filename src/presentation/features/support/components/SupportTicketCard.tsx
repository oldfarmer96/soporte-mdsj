import type { SupportTicketListItem } from "@/shared/interfaces/supportTicket.interface";
import { CalendarDays, ChevronRight, MapPin, UserRound, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../../tickets/components/TicketBadges";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const SupportTicketCard = ({ ticket }: { ticket: SupportTicketListItem }) => (
  <li>
    <Link
      to={`/apoyo/tickets/${ticket.id}`}
      className="block rounded-box border border-base-300 bg-base-100 p-5 shadow-sm transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-base-content/50">
            {ticket.code}
          </p>
          <h2 className="mt-1 break-words font-black">{ticket.subject}</h2>
        </div>
        <ChevronRight className="size-5 shrink-0 text-base-content/40" aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <dl className="mt-4 grid gap-2 border-t border-base-300 pt-4 text-sm text-base-content/65">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Solicitante</dt>
          <dd className="truncate font-semibold">{ticket.requesterName}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Ubicación</dt>
          <dd className="truncate">{ticket.areaName} · {ticket.subareaName}</dd>
        </div>
        <div className="truncate pl-6 text-xs">
          {ticket.categoryName} · {ticket.problemTypeName}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Wrench className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Personal asignado</dt>
          <dd className="truncate">{ticket.assignedAgentName ?? "Sin asignar"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Fecha de creación</dt>
          <dd>Creado {dateFormatter.format(new Date(ticket.createdAt))}</dd>
        </div>
      </dl>
    </Link>
  </li>
);

export default SupportTicketCard;
