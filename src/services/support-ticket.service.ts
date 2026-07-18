import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import type {
  ChangeTicketStateInput,
  PaginatedSupportTickets,
  ResolveTicketInput,
  SupportAgent,
  SupportTicketDetail,
  SupportTicketFilters,
} from "@/shared/interfaces/supportTicket.interface";
import type {
  TicketImpact,
  TicketStatus,
} from "@/shared/interfaces/ticket.interface";
import { supabase } from "@/shared/utils/supabase";
import { getTicketDetail } from "./ticket.service";

interface NamedRelation {
  nombre: string;
}

interface ProfileRelation {
  id: string;
  dni?: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  rol?: "APOYO" | "ADMIN";
}

interface SupportTicketRow {
  id: string;
  codigo: string;
  asunto: string;
  impacto: TicketImpact;
  prioridad: TicketPriority;
  estado: TicketStatus;
  created_at: string;
  updated_at: string;
  area: NamedRelation | NamedRelation[] | null;
  categoria: NamedRelation | NamedRelation[] | null;
  solicitante: ProfileRelation | ProfileRelation[] | null;
  asignado: ProfileRelation | ProfileRelation[] | null;
}

interface SupportTicketContextRow {
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  solicitante: ProfileRelation | ProfileRelation[] | null;
  asignado: ProfileRelation | ProfileRelation[] | null;
}

interface SupportAgentRow {
  id: string;
  nombres: string;
  apellidos: string;
  rol: "APOYO" | "ADMIN";
}

const firstRelation = <T>(relation: T | T[] | null): T | null =>
  Array.isArray(relation) ? (relation[0] ?? null) : relation;

const relationName = (relation: NamedRelation | NamedRelation[] | null) =>
  firstRelation(relation)?.nombre ?? "No disponible";

const profileName = (profile: ProfileRelation | null) =>
  profile ? `${profile.nombres} ${profile.apellidos}` : null;

const sanitizeSearch = (search: string) =>
  search
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);

const nextDate = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export const getSupportTickets = async (
  filters: SupportTicketFilters,
): Promise<PaginatedSupportTickets> => {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  let query = supabase
    .from("tickets")
    .select(
      "id, codigo, asunto, impacto, prioridad, estado, created_at, updated_at, area:areas(nombre), categoria:categorias(nombre), solicitante:perfiles!tickets_id_solicitante_fkey(id, nombres, apellidos), asignado:perfiles!tickets_asignado_a_fkey(id, nombres, apellidos)",
      { count: "exact" },
    )
    .order("prioridad", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) query = query.or(`codigo.ilike.%${search}%,asunto.ilike.%${search}%`);
  if (filters.status) query = query.eq("estado", filters.status);
  if (filters.priority) query = query.eq("prioridad", filters.priority);
  if (filters.areaId) query = query.eq("id_area", filters.areaId);
  if (filters.categoryId) query = query.eq("id_categoria", filters.categoryId);
  if (filters.assignment === "unassigned") query = query.is("asignado_a", null);
  if (filters.assignment === "mine") {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw error ?? new Error("AUTH_REQUIRED");
    query = query.eq("asignado_a", data.user.id);
  } else if (filters.assignment) {
    query = query.eq("asignado_a", filters.assignment);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00-05:00`);
  }
  if (filters.dateTo) {
    query = query.lt("created_at", `${nextDate(filters.dateTo)}T00:00:00-05:00`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items = (data as SupportTicketRow[]).map((ticket) => ({
    id: ticket.id,
    code: ticket.codigo,
    subject: ticket.asunto,
    impact: ticket.impacto,
    priority: ticket.prioridad,
    status: ticket.estado,
    areaName: relationName(ticket.area),
    categoryName: relationName(ticket.categoria),
    requesterName: profileName(firstRelation(ticket.solicitante)) ?? "Solicitante no disponible",
    assignedAgentName: profileName(firstRelation(ticket.asignado)),
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }));
  const total = count ?? 0;

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
};

export const getSupportAgents = async (): Promise<SupportAgent[]> => {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombres, apellidos, rol")
    .eq("estado", "ACTIVO")
    .in("rol", ["APOYO", "ADMIN"])
    .order("nombres", { ascending: true })
    .order("apellidos", { ascending: true });

  if (error) throw error;

  return (data as SupportAgentRow[]).map((agent) => ({
    id: agent.id,
    name: `${agent.nombres} ${agent.apellidos}`,
    role: agent.rol,
  }));
};

export const getSupportTicketDetail = async (
  ticketId: string,
): Promise<SupportTicketDetail> => {
  const ticket = await getTicketDetail(ticketId);
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "assigned_at, started_at, resolved_at, closed_at, solicitante:perfiles!tickets_id_solicitante_fkey(id, dni, nombres, apellidos, telefono), asignado:perfiles!tickets_asignado_a_fkey(id, nombres, apellidos, rol)",
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("TICKET_NOT_FOUND");

  const context = data as SupportTicketContextRow;
  const requester = firstRelation(context.solicitante);
  const assignedAgent = firstRelation(context.asignado);
  if (!requester?.dni) throw new Error("TICKET_REQUESTER_NOT_FOUND");

  return {
    ...ticket,
    requester: {
      id: requester.id,
      dni: requester.dni,
      name: profileName(requester) ?? "Solicitante no disponible",
      phone: requester.telefono ?? null,
    },
    assignedAgent:
      assignedAgent?.rol === "APOYO" || assignedAgent?.rol === "ADMIN"
        ? {
            id: assignedAgent.id,
            name: profileName(assignedAgent) ?? "Personal no disponible",
            role: assignedAgent.rol,
          }
        : null,
    assignedAt: context.assigned_at,
    startedAt: context.started_at,
    resolvedAt: context.resolved_at,
    closedAt: context.closed_at,
  };
};

export const assignSupportTicket = async (ticketId: string, agentId: string) => {
  const { error } = await supabase.rpc("asignar_ticket", {
    p_id_ticket: ticketId,
    p_id_apoyo: agentId,
  });
  if (error) throw error;
};

export const changeSupportTicketState = async ({
  ticketId,
  status,
  detail,
}: ChangeTicketStateInput) => {
  const { error } = await supabase.rpc("cambiar_estado_ticket", {
    p_id_ticket: ticketId,
    p_nuevo_estado: status,
    p_detalle: detail?.trim() || null,
  });
  if (error) throw error;
};

export const resolveSupportTicket = async ({
  ticketId,
  diagnosis,
  solution,
}: ResolveTicketInput) => {
  const { error } = await supabase.rpc("resolver_ticket", {
    p_id_ticket: ticketId,
    p_diagnostico: diagnosis.trim(),
    p_solucion: solution.trim(),
  });
  if (error) throw error;
};

export const getSupportTicketErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (message.includes("personal seleccionado")) {
    return "El personal seleccionado ya no está disponible.";
  }
  if (message.includes("no se permite cambiar") || message.includes("no puede")) {
    return "El ticket cambió o ya no permite esta operación. Se actualizarán los datos.";
  }
  if (message.includes("no se encontró")) {
    return "No encontramos el ticket o ya no está disponible.";
  }
  if (message.includes("solución válida")) {
    return "Ingresa una solución de al menos 5 caracteres.";
  }
  if (message.includes("permiso")) {
    return "Tu cuenta no tiene permiso para realizar esta operación.";
  }

  return "No pudimos completar la operación. Actualiza el ticket e inténtalo nuevamente.";
};
