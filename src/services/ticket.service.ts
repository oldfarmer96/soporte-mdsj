import type {
  CreateTicketInput,
  CreatedTicket,
  ConfirmTicketSolutionInput,
  PaginatedTickets,
  TicketAttachment,
  TicketDetail,
  TicketEventType,
  TicketHistoryEvent,
  TicketImpact,
  TicketListFilters,
  TicketListItem,
  TicketResolution,
  ReopenTicketInput,
  TicketStatus,
} from "@/shared/interfaces/ticket.interface";
import type { TicketPriority } from "@/shared/interfaces/catalog.interface";
import { supabase } from "@/shared/utils/supabase";

interface CreatedTicketRow {
  id: string;
  codigo: string;
  asunto: string;
  prioridad: TicketPriority;
  estado: TicketStatus;
  created_at: string;
  updated_at: string;
}

interface NamedRelation {
  nombre: string;
}

interface TicketDetailRow extends CreatedTicketRow {
  descripcion: string | null;
  impacto: TicketImpact;
  trabajo_detenido: boolean;
  area: NamedRelation | NamedRelation[] | null;
  subarea: NamedRelation | NamedRelation[] | null;
  categoria: NamedRelation | NamedRelation[] | null;
  tipo_problema: NamedRelation | NamedRelation[] | null;
  asignado_a: string | null;
}

interface TicketListRow extends CreatedTicketRow {
  area: NamedRelation | NamedRelation[] | null;
  subarea: NamedRelation | NamedRelation[] | null;
  categoria: NamedRelation | NamedRelation[] | null;
  tipo_problema: NamedRelation | NamedRelation[] | null;
  asignado_a: string | null;
}

interface TicketHistoryRow {
  id: number;
  tipo_evento: TicketEventType;
  estado_anterior: TicketStatus | null;
  estado_nuevo: TicketStatus | null;
  prioridad_anterior: TicketPriority | null;
  prioridad_nueva: TicketPriority | null;
  detalle: string | null;
  created_at: string;
}

interface TicketResolutionRow {
  diagnostico: string | null;
  solucion: string;
  confirmado_por_solicitante: boolean | null;
  comentario_solicitante: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketAttachmentRow {
  id: string;
  bucket: string;
  path: string;
  nombre_original: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const getRelationName = (
  relation: NamedRelation | NamedRelation[] | null,
): string | null => {
  if (Array.isArray(relation)) return relation[0]?.nombre ?? null;
  return relation?.nombre ?? null;
};

export const createTicket = async (
  input: CreateTicketInput,
): Promise<CreatedTicket> => {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      id_area: input.areaId,
      id_subarea: input.subareaId,
      id_categoria: input.categoryId,
      id_tipo_problema: input.problemTypeId,
      descripcion: input.description,
      impacto: input.impact,
      trabajo_detenido: input.workStopped,
    })
    .select("id, codigo, asunto, prioridad, estado, created_at, updated_at")
    .single();

  if (error) throw error;

  const ticket = data as CreatedTicketRow;
  return {
    id: ticket.id,
    code: ticket.codigo,
    subject: ticket.asunto,
    priority: ticket.prioridad,
    status: ticket.estado,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
};

const sanitizeSearch = (search: string) =>
  search
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);

const getNextDate = (date: string) => {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
};

export const getMyTickets = async (
  filters: TicketListFilters,
): Promise<PaginatedTickets> => {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  let query = supabase
    .from("tickets")
    .select(
      "id, codigo, asunto, prioridad, estado, created_at, updated_at, asignado_a, area:areas(nombre), subarea:subareas!tickets_area_subarea_fk(nombre), categoria:categorias(nombre), tipo_problema:ticket_tipos_problemas!tickets_categoria_tipo_problema_fk(nombre)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) query = query.or(`codigo.ilike.%${search}%,asunto.ilike.%${search}%`);
  if (filters.status) query = query.eq("estado", filters.status);
  if (filters.priority) query = query.eq("prioridad", filters.priority);
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00-05:00`);
  }
  if (filters.dateTo) {
    query = query.lt("created_at", `${getNextDate(filters.dateTo)}T00:00:00-05:00`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items: TicketListItem[] = (data as TicketListRow[]).map((ticket) => ({
    id: ticket.id,
    code: ticket.codigo,
    subject: ticket.asunto,
    priority: ticket.prioridad,
    status: ticket.estado,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    areaName: getRelationName(ticket.area) ?? "Área no disponible",
    subareaName: getRelationName(ticket.subarea) ?? "Subárea no disponible",
    categoryName: getRelationName(ticket.categoria) ?? "Categoría no disponible",
    problemTypeName:
      getRelationName(ticket.tipo_problema) ?? "Tipo no disponible",
    isAssigned: Boolean(ticket.asignado_a),
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

const getTicketHistory = async (ticketId: string): Promise<TicketHistoryEvent[]> => {
  const { data, error } = await supabase
    .from("ticket_historial")
    .select(
      "id, tipo_evento, estado_anterior, estado_nuevo, prioridad_anterior, prioridad_nueva, detalle, created_at",
    )
    .eq("id_ticket", ticketId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;

  return (data as TicketHistoryRow[]).map((event) => ({
    id: event.id,
    type: event.tipo_evento,
    previousStatus: event.estado_anterior,
    newStatus: event.estado_nuevo,
    previousPriority: event.prioridad_anterior,
    newPriority: event.prioridad_nueva,
    detail: event.detalle,
    createdAt: event.created_at,
  }));
};

const getTicketResolution = async (
  ticketId: string,
): Promise<TicketResolution | null> => {
  const { data, error } = await supabase
    .from("ticket_resoluciones")
    .select(
      "diagnostico, solucion, confirmado_por_solicitante, comentario_solicitante, created_at, updated_at",
    )
    .eq("id_ticket", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const resolution = data as TicketResolutionRow;
  return {
    diagnosis: resolution.diagnostico,
    solution: resolution.solucion,
    requesterConfirmed: resolution.confirmado_por_solicitante,
    requesterComment: resolution.comentario_solicitante,
    createdAt: resolution.created_at,
    updatedAt: resolution.updated_at,
  };
};

const getTicketAttachments = async (ticketId: string): Promise<TicketAttachment[]> => {
  const { data, error } = await supabase
    .from("ticket_archivos")
    .select("id, bucket, path, nombre_original, mime_type, size_bytes, created_at")
    .eq("id_ticket", ticketId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as TicketAttachmentRow[]).map((attachment) => ({
    id: attachment.id,
    bucket: attachment.bucket,
    path: attachment.path,
    originalName: attachment.nombre_original,
    mimeType: attachment.mime_type,
    sizeBytes: attachment.size_bytes,
    createdAt: attachment.created_at,
  }));
};

export const getTicketDetail = async (ticketId: string): Promise<TicketDetail> => {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, codigo, asunto, descripcion, impacto, trabajo_detenido, prioridad, estado, asignado_a, created_at, updated_at, area:areas(nombre), subarea:subareas!tickets_area_subarea_fk(nombre), categoria:categorias(nombre), tipo_problema:ticket_tipos_problemas!tickets_categoria_tipo_problema_fk(nombre)",
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("TICKET_NOT_FOUND");

  const ticket = data as TicketDetailRow;
  const [history, resolution, attachments] = await Promise.all([
    getTicketHistory(ticketId),
    getTicketResolution(ticketId),
    getTicketAttachments(ticketId),
  ]);

  return {
    id: ticket.id,
    code: ticket.codigo,
    subject: ticket.asunto,
    description: ticket.descripcion,
    impact: ticket.impacto,
    workStopped: ticket.trabajo_detenido,
    priority: ticket.prioridad,
    status: ticket.estado,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    areaName: getRelationName(ticket.area) ?? "Área no disponible",
    subareaName: getRelationName(ticket.subarea) ?? "Subárea no disponible",
    categoryName: getRelationName(ticket.categoria) ?? "Categoría no disponible",
    problemTypeName:
      getRelationName(ticket.tipo_problema) ?? "Tipo no disponible",
    isAssigned: Boolean(ticket.asignado_a),
    history,
    resolution,
    attachments,
  };
};

export const confirmTicketSolution = async ({
  ticketId,
  solved,
  comment,
}: ConfirmTicketSolutionInput) => {
  const { error } = await supabase.rpc("confirmar_solucion_ticket", {
    p_id_ticket: ticketId,
    p_solucionado: solved,
    p_comentario: comment?.trim() || null,
  });

  if (error) throw error;
};

export const reopenTicket = async ({ ticketId, reason }: ReopenTicketInput) => {
  const { error } = await supabase.rpc("reabrir_ticket", {
    p_id_ticket: ticketId,
    p_motivo: reason.trim(),
  });

  if (error) throw error;
};

export const getTicketErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("ticket_not_found")) {
    return "No encontramos el ticket o no tienes permiso para consultarlo.";
  }
  if (normalizedMessage.includes("subárea")) {
    return "La subárea no está disponible o no corresponde al área seleccionada.";
  }
  if (normalizedMessage.includes("área seleccionada")) {
    return "El área seleccionada ya no está disponible. Elige otra opción.";
  }
  if (normalizedMessage.includes("opción otro")) {
    return "Describe el problema con al menos 5 caracteres al seleccionar Otro.";
  }
  if (normalizedMessage.includes("categoría seleccionada")) {
    return "La categoría seleccionada ya no está disponible. Elige otra opción.";
  }
  if (normalizedMessage.includes("tipo de problema")) {
    return "El tipo de problema no está disponible o no corresponde a la categoría.";
  }
  if (normalizedMessage.includes("solicitante no está activo")) {
    return "Tu perfil ya no está habilitado para registrar tickets.";
  }

  return "No pudimos registrar el ticket. Conservamos tus datos para que puedas intentarlo nuevamente.";
};

export const getTicketReadErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (message.includes("ticket_not_found")) {
    return "No encontramos el ticket o no tienes permiso para consultarlo.";
  }

  return "No pudimos cargar la información del ticket. Revisa tu conexión e inténtalo nuevamente.";
};

export const getRequesterActionErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (
    message.includes("pendiente de confirmación") ||
    message.includes("solo se puede reabrir")
  ) {
    return "El estado del ticket cambió y esta acción ya no está disponible.";
  }
  if (message.includes("no se encontró") || message.includes("no le pertenece")) {
    return "No encontramos el ticket o no tienes permiso para modificarlo.";
  }
  if (message.includes("comentario") || message.includes("motivo")) {
    return "Explica el motivo con un texto de 5 a 1000 caracteres.";
  }
  if (message.includes("solución registrada")) {
    return "El ticket no tiene una solución disponible para confirmar.";
  }

  return "No pudimos completar la acción. Actualizamos el ticket para que puedas intentarlo nuevamente.";
};
