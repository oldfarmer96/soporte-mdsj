import type {
  DashboardDateRange,
  DashboardTicketReportItem,
  SupportDashboardMetrics,
} from "@/shared/interfaces/dashboard.interface";
import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import type { TicketImpact, TicketStatus } from "@/shared/interfaces/ticket.interface";
import { supabase } from "@/shared/utils/supabase";

export const getSupportDashboardMetrics = async (
  range: DashboardDateRange,
): Promise<SupportDashboardMetrics> => {
  const { data, error } = await supabase.rpc("obtener_metricas_soporte", {
    p_desde: range.from,
    p_hasta: range.to,
  });

  if (error) throw error;
  return data as SupportDashboardMetrics;
};

interface DashboardTicketReportRow {
  codigo: string;
  created_at: string;
  updated_at: string;
  solicitante: string;
  solicitante_dni: string;
  area: string;
  subarea: string;
  categoria: string;
  tipo_problema: string | null;
  asunto: string;
  descripcion: string | null;
  impacto: TicketImpact;
  trabajo_detenido: boolean;
  prioridad: TicketPriority;
  estado: TicketStatus;
  asignado: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

export const getDashboardTicketReport = async (
  range: DashboardDateRange,
): Promise<DashboardTicketReportItem[]> => {
  const { data, error } = await supabase.rpc("obtener_detalle_reporte_soporte", {
    p_desde: range.from,
    p_hasta: range.to,
  });

  if (error) throw error;

  return (data as DashboardTicketReportRow[]).map((ticket) => ({
    code: ticket.codigo,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    requesterName: ticket.solicitante,
    requesterDni: ticket.solicitante_dni,
    areaName: ticket.area,
    subareaName: ticket.subarea,
    categoryName: ticket.categoria,
    problemTypeName: ticket.tipo_problema,
    subject: ticket.asunto,
    description: ticket.descripcion,
    impact: ticket.impacto,
    workStopped: ticket.trabajo_detenido,
    priority: ticket.prioridad,
    status: ticket.estado,
    assignedAgentName: ticket.asignado,
    assignedAt: ticket.assigned_at,
    startedAt: ticket.started_at,
    resolvedAt: ticket.resolved_at,
    closedAt: ticket.closed_at,
  }));
};

export const getDashboardErrorMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (code === "PGRST202" || message.includes("obtener_metricas_soporte")) {
    return "La función de métricas todavía no está aplicada en Supabase.";
  }
  if (message.includes("rango")) {
    return "Selecciona un rango válido de hasta 366 días.";
  }
  if (message.includes("permiso")) {
    return "Tu cuenta no tiene permiso para consultar métricas operativas.";
  }

  return "No pudimos cargar las métricas. Revisa tu conexión e inténtalo nuevamente.";
};
