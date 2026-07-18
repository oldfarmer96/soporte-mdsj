import type { DashboardDateRange } from "@/shared/interfaces/dashboard.interface";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: (range: DashboardDateRange) => [...dashboardKeys.all, "metrics", range] as const,
};
