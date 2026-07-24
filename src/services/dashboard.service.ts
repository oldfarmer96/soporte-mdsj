import type {
  DashboardDateRange,
  SupportDashboardMetrics,
} from "@/shared/interfaces/dashboard.interface";
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
