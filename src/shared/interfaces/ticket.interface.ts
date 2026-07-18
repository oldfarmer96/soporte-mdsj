import type { TicketPriority } from "./catalog.interface";

export type TicketImpact =
  | "INDIVIDUAL"
  | "USUARIOS_MULTIPLES"
  | "TODA_EL_AREA"
  | "SERVICIO_INTERRUMPIDO";

export type TicketStatus =
  | "NUEVO"
  | "ASIGNADO"
  | "EN_CURSO"
  | "RESUELTO"
  | "CERRADO"
  | "CANCELADO"
  | "REABIERTO";

export type TicketEventType =
  | "CREACION"
  | "ASIGNACION"
  | "REASIGNACION"
  | "CAMBIO_ESTADO"
  | "CAMBIO_PRIORIDAD"
  | "RESOLUCION"
  | "CIERRE"
  | "REAPERTURA"
  | "COMENTARIO";

export interface CreateTicketInput {
  areaId: string;
  categoryId: string;
  problemTypeId: string | null;
  subject: string;
  description: string;
  impact: TicketImpact;
  workStopped: boolean;
}

export interface ConfirmTicketSolutionInput {
  ticketId: string;
  solved: boolean;
  comment: string | null;
}

export interface ReopenTicketInput {
  ticketId: string;
  reason: string;
}

export interface CreatedTicket {
  id: string;
  code: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends CreatedTicket {
  description: string;
  impact: TicketImpact;
  workStopped: boolean;
  areaName: string;
  categoryName: string;
  problemTypeName: string | null;
  isAssigned: boolean;
  history: TicketHistoryEvent[];
  resolution: TicketResolution | null;
  attachments: TicketAttachment[];
}

export interface TicketListItem extends CreatedTicket {
  areaName: string;
  categoryName: string;
  isAssigned: boolean;
}

export interface TicketListFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedTickets {
  items: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketHistoryEvent {
  id: number;
  type: TicketEventType;
  previousStatus: TicketStatus | null;
  newStatus: TicketStatus | null;
  previousPriority: TicketPriority | null;
  newPriority: TicketPriority | null;
  detail: string | null;
  createdAt: string;
}

export interface TicketResolution {
  diagnosis: string | null;
  solution: string;
  requesterConfirmed: boolean | null;
  requesterComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachment {
  id: string;
  bucket: string;
  path: string;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
