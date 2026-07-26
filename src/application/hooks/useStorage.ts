import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import type { TicketAttachment } from "@/shared/interfaces/ticket.interface";
import {
  createAttachmentSignedUrl,
  deleteTicketAttachment,
  uploadTicketAttachment,
  type DeleteTicketAttachmentInput,
  type UploadTicketAttachmentInput,
} from "@/services/storage.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUploadTicketAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["upload-ticket-attachment"],
    mutationFn: (input: UploadTicketAttachmentInput) => uploadTicketAttachment(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.ticketId) });
      queryClient.invalidateQueries({
        queryKey: ticketKeys.supportDetail(variables.ticketId),
      });
    },
  });
};

export const useAttachmentSignedUrl = (attachment: TicketAttachment) =>
  useQuery({
    queryKey: ticketKeys.attachmentPreview(attachment.id),
    queryFn: () => createAttachmentSignedUrl(attachment),
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 4 * 60 * 1000,
    retry: 1,
  });

export const useDeleteTicketAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-ticket-attachment"],
    mutationFn: (input: DeleteTicketAttachmentInput) =>
      deleteTicketAttachment(input),
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: ticketKeys.attachmentPreview(variables.attachment.id),
      });
      queryClient.invalidateQueries({
        queryKey: ticketKeys.detail(variables.ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: ticketKeys.supportDetail(variables.ticketId),
      });
    },
  });
};
