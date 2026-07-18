import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import type { TicketStatus } from "@/shared/interfaces/ticket.interface";

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAJO: "Baja",
  MEDIO: "Media",
  ALTO: "Alta",
  CRITICO: "Crítica",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  BAJO: "badge-ghost",
  MEDIO: "badge-info badge-soft",
  ALTO: "badge-warning badge-soft",
  CRITICO: "badge-error badge-soft",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_CURSO: "En curso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
  REABIERTO: "Reabierto",
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  NUEVO: "badge-info badge-soft",
  ASIGNADO: "badge-secondary badge-soft",
  EN_CURSO: "badge-warning badge-soft",
  RESUELTO: "badge-success badge-soft",
  CERRADO: "badge-neutral",
  CANCELADO: "badge-error badge-outline",
  REABIERTO: "badge-accent badge-soft",
};

export const TicketPriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`badge ${PRIORITY_STYLES[priority]}`}>
    Prioridad {PRIORITY_LABELS[priority]}
  </span>
);

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <span className={`badge ${STATUS_STYLES[status]}`}>Estado: {STATUS_LABELS[status]}</span>
);
