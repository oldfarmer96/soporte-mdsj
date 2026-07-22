import { useSupportTicketDetail } from "@/application/hooks/useSupportTickets";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import PageSkeleton from "@/presentation/components/PageSkeleton";
import { getSupportTicketErrorMessage } from "@/services/support-ticket.service";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  IdCard,
  Phone,
  Tags,
  UserCheck,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import TicketAttachments from "../../tickets/components/TicketAttachments";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../../tickets/components/TicketBadges";
import TicketResolutionPanel from "../../tickets/components/TicketResolutionPanel";
import TicketTimeline from "../../tickets/components/TicketTimeline";
import SupportTicketActions from "../components/SupportTicketActions";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const SupportTicketDetailPage = () => {
  const { ticketId = "" } = useParams();
  const ticketQuery = useSupportTicketDetail(ticketId);

  if (ticketQuery.isPending) return <PageSkeleton />;
  if (ticketQuery.isError) {
    return (
      <PageContainer size="narrow">
        <PageHeader eyebrow="Personal de apoyo" title="No pudimos abrir el ticket" />
        <ErrorState
          description={getSupportTicketErrorMessage(ticketQuery.error)}
          onRetry={() => ticketQuery.refetch()}
        />
        <Link to="/apoyo/tickets" className="btn mt-5">
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a la cola
        </Link>
      </PageContainer>
    );
  }

  const ticket = ticketQuery.data;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={ticket.code}
        title={ticket.subject}
        description="Detalle operativo, trazabilidad y acciones disponibles para esta solicitud."
        breadcrumbs={[
          { label: "Resumen", path: "/apoyo" },
          { label: "Cola", path: "/apoyo/tickets" },
          { label: ticket.code },
        ]}
        actions={
          <Link to="/apoyo/tickets" className="btn">
            <ArrowLeft className="size-4" aria-hidden="true" /> Volver
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <FileText className="size-5" aria-hidden="true" /> Descripción
            </h2>
            <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed">
              {ticket.description ?? "Sin descripción adicional."}
            </p>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-box bg-base-300 sm:grid-cols-2">
              <div className="bg-base-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase text-base-content/50">
                  <Building2 className="size-4" aria-hidden="true" /> Área
                </dt>
                <dd className="mt-2 font-semibold">{ticket.areaName}</dd>
                <dd className="mt-1 text-sm text-base-content/60">
                  {ticket.subareaName}
                </dd>
              </div>
              <div className="bg-base-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase text-base-content/50">
                  <Tags className="size-4" aria-hidden="true" /> Clasificación
                </dt>
                <dd className="mt-2 font-semibold">{ticket.categoryName}</dd>
                <dd className="mt-1 text-sm text-base-content/60">
                  {ticket.problemTypeName}
                </dd>
              </div>
              <div className="bg-base-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase text-base-content/50">
                  <CalendarDays className="size-4" aria-hidden="true" /> Creado
                </dt>
                <dd className="mt-2 font-semibold">
                  {dateFormatter.format(new Date(ticket.createdAt))}
                </dd>
              </div>
              <div className="bg-base-200 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase text-base-content/50">
                  <UserCheck className="size-4" aria-hidden="true" /> Asignado
                </dt>
                <dd className="mt-2 font-semibold">
                  {ticket.assignedAgent?.name ?? "Sin asignar"}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <TicketResolutionPanel resolution={ticket.resolution} />
            <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments} />
          </div>
          <TicketTimeline history={ticket.history} />
        </div>

        <aside className="space-y-5">
          <SupportTicketActions ticket={ticket} />
          <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black">Solicitante</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div><dt className="text-base-content/50">Nombre</dt><dd className="font-semibold">{ticket.requester.name}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <IdCard className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div><dt className="text-base-content/50">DNI</dt><dd className="font-semibold">{ticket.requester.dni}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div><dt className="text-base-content/50">Teléfono</dt><dd className="font-semibold">{ticket.requester.phone ?? "No registrado"}</dd></div>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
};

export default SupportTicketDetailPage;
