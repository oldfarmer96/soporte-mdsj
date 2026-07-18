import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import type { TicketAttachment } from "@/shared/interfaces/ticket.interface";
import {
  createAttachmentSignedUrl,
  uploadTicketAttachment,
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
