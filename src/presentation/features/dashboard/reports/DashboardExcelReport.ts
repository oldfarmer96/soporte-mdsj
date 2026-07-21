import type { SupportDashboardMetrics } from "@/shared/interfaces/dashboard.interface";
import ExcelJS from "exceljs";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const styleSheet = (sheet: ExcelJS.Worksheet) => {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };
  sheet.columns.forEach((column) => {
    column.width = Math.max(14, Math.min(35, column.header?.length ?? 14));
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
};

export const exportDashboardExcel = async (
  metrics: SupportDashboardMetrics,
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Soporte MDSJ";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Resumen");
  summary.addRow(["Métrica", "Valor"]);
  summary.addRows([
    ["Periodo desde", metrics.period.from],
    ["Periodo hasta", metrics.period.to],
    ["Zona horaria", metrics.period.timezone],
    ["Tickets creados", metrics.summary.created],
    ["Tickets resueltos", metrics.summary.resolved],
    ["Tickets activos", metrics.summary.active],
    ["Tickets sin asignar", metrics.summary.unassigned],
  ]);
  styleSheet(summary);

  const addMetricSheet = (
    name: string,
    rows: Array<{ key: string; count: number }>,
  ) => {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(["Concepto", "Total"]);
    rows.forEach((row) => sheet.addRow([row.key, row.count]));
    styleSheet(sheet);
  };

  addMetricSheet("Estados", metrics.byStatus);
  addMetricSheet("Prioridades", metrics.byPriority);
  addMetricSheet("Áreas", metrics.byArea);
  addMetricSheet("Subáreas", metrics.bySubarea);
  addMetricSheet("Categorías", metrics.byCategory);
  addMetricSheet("Tipos de problema", metrics.byProblemType);

  const workload = workbook.addWorksheet("Carga de apoyo");
  workload.addRow(["Personal", "Asignados", "En curso"]);
  metrics.workload.forEach((row) =>
    workload.addRow([row.agent, row.assigned, row.inProgress]),
  );
  styleSheet(workload);

  const daily = workbook.addWorksheet("Tendencia diaria");
  daily.addRow(["Fecha", "Creados", "Resueltos"]);
  metrics.daily.forEach((row) =>
    daily.addRow([row.date, row.created, row.resolved]),
  );
  styleSheet(daily);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(
    blob,
    `reporte-soporte-${metrics.period.from}-${metrics.period.to}.xlsx`,
  );
};
