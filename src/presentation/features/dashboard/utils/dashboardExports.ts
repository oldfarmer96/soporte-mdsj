import type { SupportDashboardMetrics } from "@/shared/interfaces/dashboard.interface";

export const downloadDashboardPdf = async (metrics: SupportDashboardMetrics) => {
  const { exportDashboardPdf } = await import("../reports/DashboardPdfReport");
  await exportDashboardPdf(metrics);
};

export const downloadDashboardExcel = async (metrics: SupportDashboardMetrics) => {
  const { exportDashboardExcel } = await import("../reports/DashboardExcelReport");
  await exportDashboardExcel(metrics);
};
