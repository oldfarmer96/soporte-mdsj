import { useMyTickets } from "@/application/hooks/useTickets";
import CollapsibleFilters from "@/presentation/components/CollapsibleFilters";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import type { TicketStatus } from "@/shared/interfaces/ticket.interface";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderKanban,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Form, Link, useSearchParams } from "react-router-dom";
import { TicketPriorityBadge, TicketStatusBadge } from "../components/TicketBadges";
import TicketCard from "../components/TicketCard";

const PAGE_SIZE = 10;
const TICKET_STATUSES: TicketStatus[] = [
  "NUEVO",
  "ASIGNADO",
  "EN_CURSO",
  "RESUELTO",
  "CERRADO",
  "CANCELADO",
  "REABIERTO",
];
const TICKET_PRIORITIES: TicketPriority[] = ["BAJO", "MEDIO", "ALTO", "CRITICO"];

const STATUS_LABELS: Record<TicketStatus, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_CURSO: "En curso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
  REABIERTO: "Reabierto",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAJO: "Baja",
  MEDIO: "Media",
  ALTO: "Alta",
  CRITICO: "Crítica",
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

const isTicketStatus = (value: string | null): value is TicketStatus =>
  value !== null && TICKET_STATUSES.includes(value as TicketStatus);

const isTicketPriority = (value: string | null): value is TicketPriority =>
  value !== null && TICKET_PRIORITIES.includes(value as TicketPriority);

const isDate = (value: string | null): value is string =>
  value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);

const MyTicketsPage = () => {
  const [searchParams] = useSearchParams();
  const pageValue = Number(searchParams.get("pagina"));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const statusValue = searchParams.get("estado");
  const priorityValue = searchParams.get("prioridad");
  const fromValue = searchParams.get("desde");
  const toValue = searchParams.get("hasta");
  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: searchParams.get("q")?.trim() || undefined,
    status: isTicketStatus(statusValue) ? statusValue : undefined,
    priority: isTicketPriority(priorityValue) ? priorityValue : undefined,
    dateFrom: isDate(fromValue) ? fromValue : undefined,
    dateTo: isDate(toValue) ? toValue : undefined,
  };
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;
  const ticketsQuery = useMyTickets(filters);
  const hasFilters = activeFilterCount > 0;
  const isPageOutOfRange =
    ticketsQuery.isSuccess &&
    ticketsQuery.data.total > 0 &&
    page > ticketsQuery.data.totalPages;

  const pageUrl = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage <= 1) nextParams.delete("pagina");
    else nextParams.set("pagina", String(nextPage));
    const query = nextParams.toString();
    return query ? `?${query}` : "/tickets";
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Solicitante"
        title="Mis tickets"
        description="Consulta el estado y la última actualización de las solicitudes que registraste."
        breadcrumbs={[{ label: "Inicio", path: "/" }, { label: "Mis tickets" }]}
        actions={
          <Link to="/tickets/nuevo" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo ticket
          </Link>
        }
      />

      <Form
        key={searchParams.toString()}
        method="get"
        aria-label="Filtros de tickets"
      >
        <CollapsibleFilters activeCount={activeFilterCount} title="Buscar y filtrar">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <fieldset className="fieldset sm:col-span-2 lg:col-span-2">
            <legend className="fieldset-legend">Código o asunto</legend>
            <label className="input w-full">
              <Search className="size-4 opacity-45" aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={filters.search}
                maxLength={100}
                placeholder="ST-2026 o impresora"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Estado</legend>
            <select name="estado" className="select w-full" defaultValue={filters.status ?? ""}>
              <option value="">Todos</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Prioridad</legend>
            <select
              name="prioridad"
              className="select w-full"
              defaultValue={filters.priority ?? ""}
            >
              <option value="">Todas</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Desde</legend>
            <input
              type="date"
              name="desde"
              className="input w-full"
              defaultValue={filters.dateFrom}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Hasta</legend>
            <input
              type="date"
              name="hasta"
              className="input w-full"
              defaultValue={filters.dateTo}
            />
          </fieldset>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasFilters && (
              <Link to="/tickets" className="btn btn-ghost">
                <X className="size-4" aria-hidden="true" />
                Limpiar
              </Link>
            )}
            <button type="submit" className="btn">
              <Filter className="size-4" aria-hidden="true" />
              Aplicar filtros
            </button>
          </div>
        </CollapsibleFilters>
      </Form>

      {ticketsQuery.isPending && (
        <div className="grid gap-3" role="status">
          <span className="sr-only">Cargando tickets...</span>
          {[0, 1, 2].map((item) => (
            <div key={item} className="skeleton h-44 w-full" />
          ))}
        </div>
      )}
      {ticketsQuery.isError && <ErrorState onRetry={() => ticketsQuery.refetch()} />}
      {ticketsQuery.isSuccess && ticketsQuery.data.items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={
            isPageOutOfRange
              ? "Esta página ya no está disponible"
              : hasFilters
                ? "No encontramos resultados"
                : "Todavía no tienes tickets"
          }
          description={
            isPageOutOfRange
              ? "El listado cambió o la dirección contiene un número de página fuera del rango."
              : hasFilters
              ? "Prueba con otros términos o limpia los filtros aplicados."
              : "Cuando registres una solicitud aparecerá aquí para que puedas seguir su atención."
          }
          action={
            isPageOutOfRange ? (
              <Link to={pageUrl(1)} className="btn">
                Volver a la primera página
              </Link>
            ) : hasFilters ? (
              <Link to="/tickets" className="btn">
                Limpiar filtros
              </Link>
            ) : (
              <Link to="/tickets/nuevo" className="btn btn-primary">
                <Plus className="size-4" aria-hidden="true" />
                Registrar ticket
              </Link>
            )
          }
        />
      )}
      {ticketsQuery.isSuccess && ticketsQuery.data.items.length > 0 && (
        <section
          className={ticketsQuery.isPlaceholderData ? "opacity-60" : undefined}
          aria-busy={ticketsQuery.isPlaceholderData}
          aria-labelledby="ticket-results-title"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="ticket-results-title" className="text-sm font-black">
              {ticketsQuery.data.total} tickets encontrados
            </h2>
            <p className="text-xs text-base-content/55">
              Página {page} de {ticketsQuery.data.totalPages}
            </p>
          </div>

          <ul className="grid gap-3 lg:hidden" aria-label="Tickets encontrados">
            {ticketsQuery.data.items.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm lg:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Clasificación</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Actualizado</th>
                  <th><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {ticketsQuery.data.items.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="max-w-80">
                      <Link to={`/tickets/${ticket.id}`} className="link font-black no-underline">
                        {ticket.subject}
                      </Link>
                      <p className="mt-1 text-xs text-base-content/50">{ticket.code}</p>
                    </td>
                    <td>
                      <p className="font-semibold">{ticket.areaName}</p>
                      <p className="mt-1 text-xs text-base-content/50">
                        {ticket.subareaName}
                      </p>
                      <p className="mt-1 text-xs text-base-content/50">
                        {ticket.categoryName} · {ticket.problemTypeName}
                      </p>
                    </td>
                    <td><TicketStatusBadge status={ticket.status} /></td>
                    <td><TicketPriorityBadge priority={ticket.priority} /></td>
                    <td>
                      <time dateTime={ticket.updatedAt}>
                        {dateFormatter.format(new Date(ticket.updatedAt))}
                      </time>
                    </td>
                    <td>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="btn btn-ghost btn-square"
                        aria-label={`Abrir ticket ${ticket.code}`}
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Paginación">
            {page > 1 ? (
              <Link to={pageUrl(page - 1)} className="btn">
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <button type="button" className="btn" disabled>
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            <span className="text-sm font-semibold">
              {page} / {ticketsQuery.data.totalPages}
            </span>
            {page < ticketsQuery.data.totalPages ? (
              <Link to={pageUrl(page + 1)} className="btn">
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className="btn" disabled>
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </nav>
        </section>
      )}
    </PageContainer>
  );
};

export default MyTicketsPage;
