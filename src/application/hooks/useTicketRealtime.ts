import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import { supabase } from "@/shared/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type TicketDetailAudience = "requester" | "support";

const DETAIL_REFRESH_DELAY_MS = 100;

export const useTicketDetailRealtime = (
  ticketId: string,
  audience: TicketDetailAudience,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const detailKey =
      audience === "support"
        ? ticketKeys.supportDetail(ticketId)
        : ticketKeys.detail(ticketId);
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: detailKey, exact: true });
      }, DETAIL_REFRESH_DELAY_MS);
    };
    const channel = supabase
      .channel(`ticket-detail-${audience}-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_archivos",
          filter: `id_ticket=eq.${ticketId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_historial",
          filter: `id_ticket=eq.${ticketId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_resoluciones",
          filter: `id_ticket=eq.${ticketId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") scheduleRefresh();
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [audience, queryClient, ticketId]);
};

export const useRequesterTicketsRealtime = (requesterId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!requesterId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      }, DETAIL_REFRESH_DELAY_MS);
    };
    const channel = supabase
      .channel(`requester-tickets-${requesterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id_solicitante=eq.${requesterId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") scheduleRefresh();
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, requesterId]);
};
