import { useTicketDetail } from "@/application/hooks/useTickets";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import PageSkeleton from "@/presentation/components/PageSkeleton";
import type { TicketImpact } from "@/shared/interfaces/ticket.interface";
import { getTicketReadErrorMessage } from "@/services/ticket.service";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CircleHelp,
  FileText,
  Plus,
  Tags,
  UserCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../components/TicketBadges";
import TicketAttachments from "../components/TicketAttachments";
import TicketResolutionPanel from "../components/TicketResolutionPanel";
import TicketTimeline from "../components/TicketTimeline";
import RequesterTicketActions from "../components/RequesterTicketActions";

const IMPACT_LABELS: Record<TicketImpact, string> = {
  INDIVIDUAL: "Individual",
  USUARIOS_MULTIPLES: "Varios usuarios",
  TODA_EL_AREA: "Toda el área",
  SERVICIO_INTERRUMPIDO: "Servicio interrumpido",
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "long",
  timeStyle: "short",
});

const TicketCreatedPage = () => {
  const { ticketId = "" } = useParams();
  const ticketQuery = useTicketDetail(ticketId);

  if (ticketQuery.isPending) return <PageSkeleton />;

  if (ticketQuery.isError) {
    return (
      <PageContainer size="narrow">
        <PageHeader
          eyebrow="Solicitante"
          title="No pudimos abrir el ticket"
          breadcrumbs={[{ label: "Inicio", path: "/" }, { label: "Ticket" }]}
        />
        <ErrorState
          description={getTicketReadErrorMessage(ticketQuery.error)}
          onRetry={() => ticketQuery.refetch()}
        />
        <Link to="/" className="btn mt-5">
          Volver al inicio
        </Link>
      </PageContainer>
    );
  }

  const ticket = ticketQuery.data;

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Detalle del ticket"
        title={ticket.subject}
        description="Consulta la clasificación, el estado y los cambios registrados durante la atención."
        breadcrumbs={[
          { label: "Inicio", path: "/" },
          { label: "Mis tickets", path: "/tickets" },
          { label: ticket.code },
        ]}
      />

      <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 bg-success/10 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success text-success-content">
              <Check className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 grow">
              <p className="text-sm font-semibold text-base-content/60">
                Código de seguimiento
              </p>
              <p className="mt-1 break-all text-2xl font-black tracking-tight sm:text-3xl">
                {ticket.code}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        <dl className="grid gap-px bg-base-300 sm:grid-cols-2">
          <div className="bg-base-100 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              <Building2 className="size-4" aria-hidden="true" />
              Área
            </dt>
            <dd className="mt-2 font-semibold">{ticket.areaName}</dd>
            <dd className="mt-1 text-sm text-base-content/60">
              {ticket.subareaName}
            </dd>
          </div>
          <div className="bg-base-100 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              <Tags className="size-4" aria-hidden="true" />
              Categoría
            </dt>
            <dd className="mt-2 font-semibold">{ticket.categoryName}</dd>
          </div>
          <div className="bg-base-100 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              <CircleHelp className="size-4" aria-hidden="true" />
              Tipo e impacto
            </dt>
            <dd className="mt-2 font-semibold">
              {ticket.problemTypeName}
            </dd>
            <dd className="mt-1 text-sm text-base-content/60">
              {IMPACT_LABELS[ticket.impact]}
              {ticket.workStopped ? " · Trabajo detenido" : ""}
            </dd>
          </div>
          <div className="bg-base-100 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              <CalendarDays className="size-4" aria-hidden="true" />
              Registrado
            </dt>
            <dd className="mt-2 font-semibold">
              <time dateTime={ticket.createdAt}>
                {dateFormatter.format(new Date(ticket.createdAt))}
              </time>
            </dd>
          </div>
          <div className="bg-base-100 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              <UserCheck className="size-4" aria-hidden="true" />
              Asignación
            </dt>
            <dd className="mt-2 font-semibold">
              {ticket.isAssigned
                ? "Personal de apoyo asignado"
                : "Pendiente de asignación"}
            </dd>
          </div>
        </dl>

        <div className="border-t border-base-300 p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-base-content/55">
            <FileText className="size-4" aria-hidden="true" />
            Descripción
          </h2>
          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed sm:text-base">
            {ticket.description ?? "Sin descripción adicional."}
          </p>
        </div>
      </section>

      {(ticket.status === "RESUELTO" || ticket.status === "CERRADO") && (
        <div className="mt-5">
          <RequesterTicketActions ticket={ticket} />
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <TicketResolutionPanel resolution={ticket.resolution} />
        <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments} />
      </div>

      <div className="mt-5">
        <TicketTimeline history={ticket.history} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link to="/tickets/nuevo" className="btn">
          <Plus className="size-4" aria-hidden="true" />
          Registrar otro
        </Link>
        <Link to="/tickets" className="btn btn-primary">
          Ver mis tickets
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </PageContainer>
  );
};

export default TicketCreatedPage;
