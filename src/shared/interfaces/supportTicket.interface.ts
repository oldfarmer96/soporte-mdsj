import type { TicketPriority } from "./catalog.interface";
import type {
  TicketDetail,
  TicketImpact,
  TicketStatus,
} from "./ticket.interface";

export interface SupportAgent {
  id: string;
  name: string;
  role: "APOYO";
}

export interface TicketRequester {
  id: string;
  dni: string;
  name: string;
  phone: string | null;
}

export interface SupportTicketListItem {
  id: string;
  code: string;
  subject: string;
  impact: TicketImpact;
  priority: TicketPriority;
  status: TicketStatus;
  areaName: string;
  subareaName: string;
  categoryName: string;
  problemTypeName: string;
  requesterName: string;
  assignedAgentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  areaId?: string;
  subareaId?: string;
  categoryId?: string;
  problemTypeId?: string;
  assignment?: "mine" | "unassigned" | string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedSupportTickets {
  items: SupportTicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SupportTicketDetail extends TicketDetail {
  requester: TicketRequester;
  assignedAgent: SupportAgent | null;
  assignedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface ChangeTicketStateInput {
  ticketId: string;
  status: "EN_CURSO" | "CANCELADO";
  detail?: string;
}

export interface ResolveTicketInput {
  ticketId: string;
  diagnosis: string;
  solution: string;
}
