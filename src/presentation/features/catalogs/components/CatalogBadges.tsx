import type { TicketPriority } from "@/shared/interfaces/catalog.interface";

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  BAJO: "badge-ghost",
  MEDIO: "badge-info badge-soft",
  ALTO: "badge-warning badge-soft",
  CRITICO: "badge-error badge-soft",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAJO: "Baja",
  MEDIO: "Media",
  ALTO: "Alta",
  CRITICO: "Crítica",
};

export const CatalogStatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`badge badge-sm gap-1.5 ${
      isActive ? "badge-success badge-soft" : "badge-neutral badge-outline"
    }`}
  >
    <span
      className={`status ${isActive ? "status-success" : "status-neutral"}`}
      aria-hidden="true"
    />
    {isActive ? "Activo" : "Inactivo"}
  </span>
);

export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`badge badge-sm ${PRIORITY_STYLES[priority]}`}>
    Prioridad {PRIORITY_LABELS[priority]}
  </span>
);
