import { useMyTickets } from "@/application/hooks/useTickets";
import DateTimeDisplay from "@/presentation/components/DateTimeDisplay";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";

const PendingConfirmations = () => {
  const ticketsQuery = useMyTickets({
    page: 1,
    pageSize: 3,
    status: "RESUELTO",
  });

  if (!ticketsQuery.isSuccess || ticketsQuery.data.total === 0) return null;

  return (
    <section
      className="mt-6 rounded-box border border-warning/30 bg-warning/10 p-5 sm:p-6"
      aria-labelledby="pending-confirmations-title"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning text-warning-content">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 grow">
          <h2 id="pending-confirmations-title" className="font-black">
            {ticketsQuery.data.total === 1
              ? "Tienes una solución pendiente de confirmación"
              : `Tienes ${ticketsQuery.data.total} soluciones pendientes de confirmación`}
          </h2>
          <p className="mt-1 text-sm text-base-content/65">
            Revisa el resultado informado por apoyo y confirma si el problema terminó.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2">
        {ticketsQuery.data.items.map((ticket) => (
          <li key={ticket.id}>
            <Link
              to={`/tickets/${ticket.id}`}
              className="flex min-w-0 items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:bg-base-200"
            >
              <div className="min-w-0 grow">
                <p className="text-xs font-bold text-base-content/50">{ticket.code}</p>
                <h3 className="mt-1 wrap-break-word font-black">{ticket.subject}</h3>
                <div className="mt-2 text-sm text-base-content/65">
                  <DateTimeDisplay value={ticket.updatedAt} />
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-base-content/45" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end">
        <Link to="/tickets?estado=RESUELTO" className="btn btn-sm">
          Ver todos los pendientes
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

export default PendingConfirmations;
