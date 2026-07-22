import type { SupportDashboardMetrics } from "@/shared/interfaces/dashboard.interface";
import { getDashboardTicketReport } from "@/services/dashboard.service";

export const downloadDashboardExcel = async (metrics: SupportDashboardMetrics) => {
  const [{ exportDashboardExcel }, tickets] = await Promise.all([
    import("../reports/DashboardExcelReport"),
    getDashboardTicketReport({ from: metrics.period.from, to: metrics.period.to }),
  ]);
  await exportDashboardExcel(metrics, tickets);
};
