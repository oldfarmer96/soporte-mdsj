import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import type {
  ChangeTicketStateInput,
  ResolveTicketInput,
  SupportTicketFilters,
} from "@/shared/interfaces/supportTicket.interface";
import {
  assignSupportTicket,
  changeSupportTicketState,
  getSupportAgents,
  getSupportTicketDetail,
  getSupportTicketErrorMessage,
  getSupportTickets,
  resolveSupportTicket,
} from "@/services/support-ticket.service";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

const useRefreshSupportTickets = () => {
  const queryClient = useQueryClient();
  return (ticketId: string) => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.supportLists() });
    queryClient.invalidateQueries({ queryKey: ticketKeys.supportDetail(ticketId) });
    queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
  };
};

export const useSupportTickets = (filters: SupportTicketFilters) =>
  useQuery({
    queryKey: ticketKeys.supportList(filters),
    queryFn: () => getSupportTickets(filters),
    placeholderData: keepPreviousData,
    retry: 2,
  });

export const useSupportAgents = () =>
  useQuery({
    queryKey: ticketKeys.supportAgents(),
    queryFn: getSupportAgents,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

export const useSupportTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.supportDetail(ticketId),
    queryFn: () => getSupportTicketDetail(ticketId),
    enabled: Boolean(ticketId),
    retry: 1,
  });

export const useAssignSupportTicket = () => {
  const refresh = useRefreshSupportTickets();
  return useMutation({
    mutationKey: ["assign-support-ticket"],
    mutationFn: ({ ticketId, agentId }: { ticketId: string; agentId: string }) =>
      assignSupportTicket(ticketId, agentId),
    onSuccess: (_, variables) => {
      toast.success("Asignación actualizada");
      refresh(variables.ticketId);
    },
    onError: (error, variables) => {
      toast.error(getSupportTicketErrorMessage(error));
      refresh(variables.ticketId);
    },
  });
};

export const useChangeSupportTicketState = () => {
  const refresh = useRefreshSupportTickets();
  return useMutation({
    mutationKey: ["change-support-ticket-state"],
    mutationFn: (input: ChangeTicketStateInput) => changeSupportTicketState(input),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "EN_CURSO" ? "Atención iniciada" : "Ticket cancelado",
      );
      refresh(variables.ticketId);
    },
    onError: (error, variables) => {
      toast.error(getSupportTicketErrorMessage(error));
      refresh(variables.ticketId);
    },
  });
};

export const useResolveSupportTicket = () => {
  const refresh = useRefreshSupportTickets();
  return useMutation({
    mutationKey: ["resolve-support-ticket"],
    mutationFn: (input: ResolveTicketInput) => resolveSupportTicket(input),
    onSuccess: (_, variables) => {
      toast.success("Solución registrada correctamente");
      refresh(variables.ticketId);
    },
    onError: (error, variables) => {
      toast.error(getSupportTicketErrorMessage(error));
      refresh(variables.ticketId);
    },
  });
};
