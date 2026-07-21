import type {
  DashboardTicketReportItem,
  SupportDashboardMetrics,
} from "@/shared/interfaces/dashboard.interface";
import ExcelJS from "exceljs";

const HEADER_FILL = "FF1F2937";
const HEADER_TEXT = "FFFFFFFF";
const ACCENT_FILL = "FFE5E7EB";

const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_CURSO: "En curso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
  REABIERTO: "Reabierto",
};

const PRIORITY_LABELS: Record<string, string> = {
  BAJO: "Baja",
  MEDIO: "Media",
  ALTO: "Alta",
  CRITICO: "Crítica",
};

const IMPACT_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  USUARIOS_MULTIPLES: "Varios usuarios",
  TODA_EL_AREA: "Toda el área",
  SERVICIO_INTERRUMPIDO: "Servicio interrumpido",
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const styleHeader = (sheet: ExcelJS.Worksheet, rowNumber = 1) => {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle" };
};

const autoSizeColumns = (sheet: ExcelJS.Worksheet, maximum = 40) => {
  sheet.columns.forEach((column) => {
    let width = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const value = cell.value instanceof Date ? "00/00/0000 00:00" : String(cell.value ?? "");
      width = Math.max(width, Math.min(maximum, value.length + 2));
    });
    column.width = width;
  });
};

const addMetricSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<{ key: string; count: number }>,
  labels?: Record<string, string>,
) => {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(["Concepto", "Total"]);
  rows.forEach((row) => sheet.addRow([labels?.[row.key] ?? row.key, row.count]));
  styleHeader(sheet);
  sheet.autoFilter = { from: "A1", to: "B1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  autoSizeColumns(sheet);
};

const toDate = (value: string | null) => (value ? new Date(value) : null);

export const exportDashboardExcel = async (
  metrics: SupportDashboardMetrics,
  tickets: DashboardTicketReportItem[],
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Soporte MDSJ";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Resumen", {
    views: [{ showGridLines: false }],
  });
  summary.mergeCells("A1:D1");
  summary.getCell("A1").value = "Reporte de soporte MDSJ";
  summary.getCell("A1").font = { bold: true, size: 18, color: { argb: HEADER_TEXT } };
  summary.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  summary.getCell("A1").alignment = { vertical: "middle" };
  summary.getRow(1).height = 30;

  summary.mergeCells("A2:D2");
  summary.getCell("A2").value = `Periodo: ${metrics.period.from} al ${metrics.period.to}`;
  summary.getCell("A2").font = { italic: true };

  summary.addRow([]);
  summary.addRow([
    "Tickets creados",
    "Tickets resueltos",
    "Tickets activos",
    "Tickets sin asignar",
  ]);
  summary.addRow([
    metrics.summary.created,
    metrics.summary.resolved,
    metrics.summary.active,
    metrics.summary.unassigned,
  ]);
  const metricHeader = summary.getRow(4);
  metricHeader.font = { bold: true };
  metricHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: ACCENT_FILL },
  };
  summary.getRow(5).font = { bold: true, size: 16 };
  summary.columns = [{ width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }];

  const detail = workbook.addWorksheet("Detalle de tickets");
  detail.addRow([
    "Código",
    "Creado",
    "Actualizado",
    "Solicitante",
    "DNI",
    "Área",
    "Subárea",
    "Categoría",
    "Tipo de problema",
    "Asunto",
    "Descripción",
    "Impacto",
    "Trabajo detenido",
    "Prioridad",
    "Estado",
    "Personal asignado",
    "Asignado el",
    "Inicio de atención",
    "Resuelto el",
    "Cerrado el",
  ]);
  tickets.forEach((ticket) => {
    detail.addRow([
      ticket.code,
      toDate(ticket.createdAt),
      toDate(ticket.updatedAt),
      ticket.requesterName,
      ticket.requesterDni,
      ticket.areaName,
      ticket.subareaName,
      ticket.categoryName,
      ticket.problemTypeName ?? "No disponible",
      ticket.subject,
      ticket.description ?? "",
      IMPACT_LABELS[ticket.impact],
      ticket.workStopped ? "Sí" : "No",
      PRIORITY_LABELS[ticket.priority],
      STATUS_LABELS[ticket.status],
      ticket.assignedAgentName ?? "Sin asignar",
      toDate(ticket.assignedAt),
      toDate(ticket.startedAt),
      toDate(ticket.resolvedAt),
      toDate(ticket.closedAt),
    ]);
  });
  styleHeader(detail);
  detail.autoFilter = { from: "A1", to: "T1" };
  detail.views = [{ state: "frozen", ySplit: 1, xSplit: 1 }];
  detail.getColumn(5).numFmt = "@";
  [2, 3, 17, 18, 19, 20].forEach((column) => {
    detail.getColumn(column).numFmt = "dd/mm/yyyy hh:mm";
  });
  detail.getColumn(11).alignment = { wrapText: true, vertical: "top" };
  autoSizeColumns(detail, 45);

  addMetricSheet(workbook, "Estados", metrics.byStatus, STATUS_LABELS);
  addMetricSheet(workbook, "Prioridades", metrics.byPriority, PRIORITY_LABELS);
  addMetricSheet(workbook, "Áreas", metrics.byArea);
  addMetricSheet(workbook, "Subáreas", metrics.bySubarea);
  addMetricSheet(workbook, "Categorías", metrics.byCategory);
  addMetricSheet(workbook, "Tipos de problema", metrics.byProblemType);

  const workload = workbook.addWorksheet("Carga de apoyo");
  workload.addRow(["Personal", "Asignados", "En curso"]);
  metrics.workload.forEach((row) =>
    workload.addRow([row.agent, row.assigned, row.inProgress]),
  );
  styleHeader(workload);
  workload.autoFilter = { from: "A1", to: "C1" };
  workload.views = [{ state: "frozen", ySplit: 1 }];
  autoSizeColumns(workload);

  const daily = workbook.addWorksheet("Tendencia diaria");
  daily.addRow(["Fecha", "Creados", "Resueltos"]);
  metrics.daily.forEach((row) => daily.addRow([new Date(`${row.date}T00:00:00Z`), row.created, row.resolved]));
  styleHeader(daily);
  daily.getColumn(1).numFmt = "dd/mm/yyyy";
  daily.autoFilter = { from: "A1", to: "C1" };
  daily.views = [{ state: "frozen", ySplit: 1 }];
  autoSizeColumns(daily);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(
    blob,
    `reporte-soporte-${metrics.period.from}-${metrics.period.to}.xlsx`,
  );
};
