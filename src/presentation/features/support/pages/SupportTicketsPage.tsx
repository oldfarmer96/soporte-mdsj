import {
  useAreas,
  useCategories,
  useProblemTypes,
  useSubareas,
} from "@/application/hooks/useCatalogs";
import {
  useSupportAgents,
  useSupportTickets,
} from "@/application/hooks/useSupportTickets";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import CollapsibleFilters from "@/presentation/components/CollapsibleFilters";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import type { TicketStatus } from "@/shared/interfaces/ticket.interface";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { Form, Link, useSearchParams } from "react-router-dom";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../../tickets/components/TicketBadges";
import SupportTicketCard from "../components/SupportTicketCard";

const PAGE_SIZE = 15;
const STATUSES: TicketStatus[] = [
  "NUEVO",
  "ASIGNADO",
  "EN_CURSO",
  "RESUELTO",
  "CERRADO",
  "CANCELADO",
  "REABIERTO",
];
const PRIORITIES: TicketPriority[] = ["CRITICO", "ALTO", "MEDIO", "BAJO"];
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
const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

interface SupportTicketsPageProps {
  mode?: "queue" | "mine";
}

const isStatus = (value: string | null): value is TicketStatus =>
  value !== null && STATUSES.includes(value as TicketStatus);
const isPriority = (value: string | null): value is TicketPriority =>
  value !== null && PRIORITIES.includes(value as TicketPriority);
const isUuid = (value: string | null): value is string =>
  value !== null && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
const isDate = (value: string | null): value is string =>
  value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);

const SupportTicketsPage = ({ mode = "queue" }: SupportTicketsPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageValue = Number(searchParams.get("pagina"));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const statusValue = searchParams.get("estado");
  const priorityValue = searchParams.get("prioridad");
  const areaValue = searchParams.get("area");
  const subareaValue = searchParams.get("subarea");
  const categoryValue = searchParams.get("categoria");
  const problemTypeValue = searchParams.get("tipo");
  const assignmentValue = searchParams.get("asignado");
  const fromValue = searchParams.get("desde");
  const toValue = searchParams.get("hasta");
  const areaId = isUuid(areaValue) ? areaValue : undefined;
  const subareaId = areaId && isUuid(subareaValue) ? subareaValue : undefined;
  const categoryId = isUuid(categoryValue) ? categoryValue : undefined;
  const problemTypeId = categoryId && isUuid(problemTypeValue)
    ? problemTypeValue
    : undefined;
  const areasQuery = useAreas({ includeInactive: true });
  const subareasQuery = useSubareas({
    areaId: areaId ?? null,
    includeInactive: true,
  });
  const categoriesQuery = useCategories({ includeInactive: true });
  const problemTypesQuery = useProblemTypes({
    categoryId: categoryId ?? null,
    includeInactive: true,
  });
  const agentsQuery = useSupportAgents();
  const parsedAssignment =
    assignmentValue === "sin-asignar"
      ? "unassigned"
      : assignmentValue === "mios"
        ? "mine"
        : isUuid(assignmentValue)
          ? assignmentValue
          : undefined;
  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: searchParams.get("q")?.trim() || undefined,
    status: isStatus(statusValue) ? statusValue : undefined,
    priority: isPriority(priorityValue) ? priorityValue : undefined,
    areaId,
    subareaId,
    categoryId,
    problemTypeId,
    assignment: mode === "mine" ? "mine" : parsedAssignment,
    dateFrom: isDate(fromValue) ? fromValue : undefined,
    dateTo: isDate(toValue) ? toValue : undefined,
  };
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.areaId,
    filters.subareaId,
    filters.categoryId,
    filters.problemTypeId,
    mode === "queue" ? filters.assignment : undefined,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;
  const ticketsQuery = useSupportTickets(filters);
  const basePath = mode === "mine" ? "/apoyo/asignados" : "/apoyo/tickets";
  const hasFilters = activeFilterCount > 0;
  const isPageOutOfRange =
    ticketsQuery.isSuccess &&
    ticketsQuery.data.total > 0 &&
    page > ticketsQuery.data.totalPages;

  const pageUrl = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete("pagina");
    else params.set("pagina", String(nextPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const selectParentFilter = (
    parent: "area" | "categoria",
    child: "subarea" | "tipo",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(parent, value);
    else params.delete(parent);
    params.delete(child);
    params.delete("pagina");
    setSearchParams(params);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Personal de apoyo"
        title={mode === "mine" ? "Mis tickets asignados" : "Cola de tickets"}
        description={
          mode === "mine"
            ? "Revisa las solicitudes que están actualmente bajo tu responsabilidad."
            : "Prioriza, filtra y abre las solicitudes registradas en la mesa de soporte."
        }
        breadcrumbs={[
          { label: "Resumen", path: "/apoyo" },
          { label: mode === "mine" ? "Mis asignados" : "Cola de tickets" },
        ]}
        actions={
          mode === "mine" ? (
            <Link to="/apoyo/tickets" className="btn">Ver cola general</Link>
          ) : (
            <Link to="/apoyo/asignados" className="btn">
              <UserCheck className="size-4" aria-hidden="true" />
              Mis asignados
            </Link>
          )
        }
      />

      <Form
        key={searchParams.toString()}
        method="get"
        aria-label="Filtros de la cola"
      >
        <CollapsibleFilters activeCount={activeFilterCount} title="Filtros operativos">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10">
          <fieldset className="fieldset sm:col-span-2">
            <legend className="fieldset-legend">Código o asunto</legend>
            <label className="input w-full">
              <Search className="size-4 opacity-45" aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={filters.search}
                maxLength={100}
                placeholder="Buscar ticket"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Estado</legend>
            <select name="estado" className="select w-full" defaultValue={filters.status ?? ""}>
              <option value="">Todos</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
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
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Área</legend>
            <select
              name="area"
              className="select w-full"
              value={filters.areaId ?? ""}
              onChange={(event) =>
                selectParentFilter("area", "subarea", event.target.value)
              }
            >
              <option value="">Todas</option>
              {areasQuery.data?.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Subárea</legend>
            <select
              name="subarea"
              className="select w-full"
              defaultValue={filters.subareaId ?? ""}
              disabled={!filters.areaId || subareasQuery.isPending}
            >
              <option value="">Todas</option>
              {subareasQuery.data?.map((subarea) => (
                <option key={subarea.id} value={subarea.id}>
                  {subarea.name}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Categoría</legend>
            <select
              name="categoria"
              className="select w-full"
              value={filters.categoryId ?? ""}
              onChange={(event) =>
                selectParentFilter("categoria", "tipo", event.target.value)
              }
            >
              <option value="">Todas</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Tipo</legend>
            <select
              name="tipo"
              className="select w-full"
              defaultValue={filters.problemTypeId ?? ""}
              disabled={!filters.categoryId || problemTypesQuery.isPending}
            >
              <option value="">Todos</option>
              {problemTypesQuery.data?.map((problemType) => (
                <option key={problemType.id} value={problemType.id}>
                  {problemType.name}
                </option>
              ))}
            </select>
          </fieldset>
          {mode === "queue" && (
            <fieldset className="fieldset sm:col-span-2">
              <legend className="fieldset-legend">Asignación</legend>
              <select
                name="asignado"
                className="select w-full"
                defaultValue={assignmentValue ?? ""}
                disabled={agentsQuery.isPending || agentsQuery.isError}
              >
                <option value="">Cualquier asignación</option>
                <option value="sin-asignar">Sin asignar</option>
                <option value="mios">Asignados a mí</option>
                {agentsQuery.data?.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </fieldset>
          )}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Desde</legend>
            <input type="date" name="desde" className="input w-full" defaultValue={filters.dateFrom} />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Hasta</legend>
            <input type="date" name="hasta" className="input w-full" defaultValue={filters.dateTo} />
          </fieldset>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasFilters && (
              <Link to={basePath} className="btn btn-ghost">
                <X className="size-4" aria-hidden="true" /> Limpiar
              </Link>
            )}
            <button type="submit" className="btn">
              <Filter className="size-4" aria-hidden="true" /> Aplicar filtros
            </button>
          </div>
        </CollapsibleFilters>
      </Form>

      {ticketsQuery.isPending && (
        <div className="grid gap-3" role="status">
          <span className="sr-only">Cargando cola de tickets...</span>
          {[0, 1, 2].map((item) => <div key={item} className="skeleton h-48 w-full" />)}
        </div>
      )}
      {ticketsQuery.isError && <ErrorState onRetry={() => ticketsQuery.refetch()} />}
      {ticketsQuery.isSuccess && ticketsQuery.data.items.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={isPageOutOfRange ? "Esta página ya no está disponible" : "No hay tickets para mostrar"}
          description={
            isPageOutOfRange
              ? "Vuelve a la primera página para continuar revisando la cola."
              : hasFilters
                ? "Prueba con otros filtros para ampliar los resultados."
                : mode === "mine"
                  ? "No tienes tickets asignados en este momento."
                  : "La cola de soporte está vacía."
          }
          action={
            isPageOutOfRange ? (
              <Link to={pageUrl(1)} className="btn">Primera página</Link>
            ) : hasFilters ? (
              <Link to={basePath} className="btn">Limpiar filtros</Link>
            ) : undefined
          }
        />
      )}
      {ticketsQuery.isSuccess && ticketsQuery.data.items.length > 0 && (
        <section
          className={ticketsQuery.isPlaceholderData ? "opacity-60" : undefined}
          aria-busy={ticketsQuery.isPlaceholderData}
          aria-labelledby="support-results-title"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="support-results-title" className="text-sm font-black">
              {ticketsQuery.data.total} tickets encontrados
            </h2>
            <p className="text-xs text-base-content/55">
              Orden: más recientes primero
            </p>
          </div>

          <ul className="grid gap-3 lg:hidden" aria-label="Tickets de soporte">
            {ticketsQuery.data.items.map((ticket) => (
              <SupportTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm lg:block">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Solicitante</th>
                  <th>Clasificación</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Asignado</th>
                  <th>Creado</th>
                  <th><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {ticketsQuery.data.items.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="max-w-64">
                      <Link to={`/apoyo/tickets/${ticket.id}`} className="link font-black no-underline">
                        {ticket.subject}
                      </Link>
                      <p className="mt-1 text-xs text-base-content/50">{ticket.code}</p>
                    </td>
                    <td>{ticket.requesterName}</td>
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
                    <td>{ticket.assignedAgentName ?? "Sin asignar"}</td>
                    <td><time dateTime={ticket.createdAt}>{dateFormatter.format(new Date(ticket.createdAt))}</time></td>
                    <td>
                      <Link
                        to={`/apoyo/tickets/${ticket.id}`}
                        className="btn btn-ghost btn-square btn-sm"
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
            <span className="text-sm font-semibold">{page} / {ticketsQuery.data.totalPages}</span>
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

export default SupportTicketsPage;
