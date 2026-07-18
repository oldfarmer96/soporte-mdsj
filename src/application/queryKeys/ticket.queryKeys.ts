import type { TicketListFilters } from "@/shared/interfaces/ticket.interface";
import type { SupportTicketFilters } from "@/shared/interfaces/supportTicket.interface";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketListFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (ticketId: string) => [...ticketKeys.details(), ticketId] as const,
  support: () => [...ticketKeys.all, "support"] as const,
  supportLists: () => [...ticketKeys.support(), "list"] as const,
  supportList: (filters: SupportTicketFilters) =>
    [...ticketKeys.supportLists(), filters] as const,
  supportDetails: () => [...ticketKeys.support(), "detail"] as const,
  supportDetail: (ticketId: string) =>
    [...ticketKeys.supportDetails(), ticketId] as const,
  supportAgents: () => [...ticketKeys.support(), "agents"] as const,
  attachmentPreview: (attachmentId: string) =>
    [...ticketKeys.all, "attachment-preview", attachmentId] as const,
};
