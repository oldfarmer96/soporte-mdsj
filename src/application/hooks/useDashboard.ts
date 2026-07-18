import { dashboardKeys } from "@/application/queryKeys/dashboard.queryKeys";
import type { DashboardDateRange } from "@/shared/interfaces/dashboard.interface";
import { getSupportDashboardMetrics } from "@/services/dashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useSupportDashboard = (range: DashboardDateRange, enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.metrics(range),
    queryFn: () => getSupportDashboardMetrics(range),
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
