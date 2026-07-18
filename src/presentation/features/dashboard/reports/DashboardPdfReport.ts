import type { SupportDashboardMetrics } from "@/shared/interfaces/dashboard.interface";
import { pdf } from "@react-pdf/renderer";
import DashboardPdfDocument from "./DashboardPdfDocument";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportDashboardPdf = async (metrics: SupportDashboardMetrics) => {
  const blob = await pdf(DashboardPdfDocument({ metrics })).toBlob();
  downloadBlob(blob, `reporte-soporte-${metrics.period.from}-${metrics.period.to}.pdf`);
};
