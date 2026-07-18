import { catalogKeys } from "@/application/queryKeys/catalog.queryKeys";
import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import type {
  ConfirmTicketSolutionInput,
  CreateTicketInput,
  ReopenTicketInput,
  TicketListFilters,
} from "@/shared/interfaces/ticket.interface";
import {
  confirmTicketSolution,
  createTicket,
  getMyTickets,
  getRequesterActionErrorMessage,
  getTicketDetail,
  reopenTicket,
} from "@/services/ticket.service";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useCreateTicket = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["create-ticket"],
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success(`Ticket ${ticket.code} registrado correctamente`);
      navigate(`/tickets/${ticket.id}`, { replace: true });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
  });
};

export const useTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => getTicketDetail(ticketId),
    enabled: Boolean(ticketId),
    retry: 1,
  });

export const useMyTickets = (filters: TicketListFilters) =>
  useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => getMyTickets(filters),
    placeholderData: keepPreviousData,
    retry: 2,
  });

const useRefreshRequesterTicket = () => {
  const queryClient = useQueryClient();
  return (ticketId: string) => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    queryClient.invalidateQueries({ queryKey: ticketKeys.supportLists() });
    queryClient.invalidateQueries({ queryKey: ticketKeys.supportDetail(ticketId) });
  };
};

export const useConfirmTicketSolution = () => {
  const refresh = useRefreshRequesterTicket();
  return useMutation({
    mutationKey: ["confirm-ticket-solution"],
    mutationFn: (input: ConfirmTicketSolutionInput) => confirmTicketSolution(input),
    onSuccess: (_, variables) => {
      toast.success(
        variables.solved
          ? "Solución confirmada y ticket cerrado"
          : "El ticket fue reabierto para continuar la atención",
      );
      refresh(variables.ticketId);
    },
    onError: (error, variables) => {
      toast.error(getRequesterActionErrorMessage(error));
      refresh(variables.ticketId);
    },
  });
};

export const useReopenTicket = () => {
  const refresh = useRefreshRequesterTicket();
  return useMutation({
    mutationKey: ["reopen-ticket"],
    mutationFn: (input: ReopenTicketInput) => reopenTicket(input),
    onSuccess: (_, variables) => {
      toast.success("Ticket reabierto correctamente");
      refresh(variables.ticketId);
    },
    onError: (error, variables) => {
      toast.error(getRequesterActionErrorMessage(error));
      refresh(variables.ticketId);
    },
  });
};
