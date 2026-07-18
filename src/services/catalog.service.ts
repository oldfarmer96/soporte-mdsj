import type {
  Area,
  AreaPayload,
  CatalogQueryOptions,
  Category,
  CategoryPayload,
  ProblemType,
  ProblemTypePayload,
  ProblemTypeQueryOptions,
  TicketPriority,
} from "@/shared/interfaces/catalog.interface";
import { supabase } from "@/shared/utils/supabase";

interface AreaRow {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number | null;
  referencia: string | null;
  activo: boolean;
}

interface CategoryRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_critico: boolean;
  activo: boolean;
}

interface ProblemTypeRow {
  id: string;
  id_categoria: string;
  nombre: string;
  descripcion: string | null;
  prioridad: TicketPriority;
  activo: boolean;
}

export const getAreas = async ({
  includeInactive = false,
}: CatalogQueryOptions = {}): Promise<Area[]> => {
  let query = supabase
    .from("areas")
    .select("id, nombre, nombre_corto, piso, referencia, activo")
    .order("nombre", { ascending: true });

  if (!includeInactive) query = query.eq("activo", true);

  const { data, error } = await query;
  if (error) throw error;

  return (data as AreaRow[]).map((area) => ({
    id: area.id,
    name: area.nombre,
    shortName: area.nombre_corto,
    floor: area.piso,
    reference: area.referencia,
    isActive: area.activo,
  }));
};

export const getCategories = async ({
  includeInactive = false,
}: CatalogQueryOptions = {}): Promise<Category[]> => {
  let query = supabase
    .from("categorias")
    .select("id, nombre, descripcion, es_critico, activo")
    .order("nombre", { ascending: true });

  if (!includeInactive) query = query.eq("activo", true);

  const { data, error } = await query;
  if (error) throw error;

  return (data as CategoryRow[]).map((category) => ({
    id: category.id,
    name: category.nombre,
    description: category.descripcion,
    isCritical: category.es_critico,
    isActive: category.activo,
  }));
};

export const getProblemTypes = async ({
  categoryId,
  includeInactive = false,
}: ProblemTypeQueryOptions = {}): Promise<ProblemType[]> => {
  let query = supabase
    .from("ticket_tipos_problemas")
    .select("id, id_categoria, nombre, descripcion, prioridad, activo")
    .order("nombre", { ascending: true });

  if (categoryId) query = query.eq("id_categoria", categoryId);
  if (!includeInactive) query = query.eq("activo", true);

  const { data, error } = await query;
  if (error) throw error;

  return (data as ProblemTypeRow[]).map((problemType) => ({
    id: problemType.id,
    categoryId: problemType.id_categoria,
    name: problemType.nombre,
    description: problemType.descripcion,
    priority: problemType.prioridad,
    isActive: problemType.activo,
  }));
};

export const createArea = async (payload: AreaPayload) => {
  const { error } = await supabase.from("areas").insert({
    nombre: payload.name.trim(),
    nombre_corto: payload.shortName,
    piso: payload.floor,
    referencia: payload.reference,
  });
  if (error) throw error;
};

export const updateArea = async (areaId: string, payload: AreaPayload) => {
  const { error } = await supabase
    .from("areas")
    .update({
      nombre: payload.name.trim(),
      nombre_corto: payload.shortName,
      piso: payload.floor,
      referencia: payload.reference,
    })
    .eq("id", areaId);
  if (error) throw error;
};

export const setAreaActive = async (areaId: string, isActive: boolean) => {
  const { error } = await supabase.from("areas").update({ activo: isActive }).eq("id", areaId);
  if (error) throw error;
};

export const createCategory = async (payload: CategoryPayload) => {
  const { error } = await supabase.from("categorias").insert({
    nombre: payload.name.trim(),
    descripcion: payload.description,
    es_critico: payload.isCritical,
  });
  if (error) throw error;
};

export const updateCategory = async (categoryId: string, payload: CategoryPayload) => {
  const { error } = await supabase
    .from("categorias")
    .update({
      nombre: payload.name.trim(),
      descripcion: payload.description,
      es_critico: payload.isCritical,
    })
    .eq("id", categoryId);
  if (error) throw error;
};

export const setCategoryActive = async (categoryId: string, isActive: boolean) => {
  const { error } = await supabase
    .from("categorias")
    .update({ activo: isActive })
    .eq("id", categoryId);
  if (error) throw error;
};

export const createProblemType = async (payload: ProblemTypePayload) => {
  const { error } = await supabase.from("ticket_tipos_problemas").insert({
    id_categoria: payload.categoryId,
    nombre: payload.name.trim(),
    descripcion: payload.description,
    prioridad: payload.priority,
  });
  if (error) throw error;
};

export const updateProblemType = async (
  problemTypeId: string,
  payload: ProblemTypePayload,
) => {
  const { error } = await supabase
    .from("ticket_tipos_problemas")
    .update({
      id_categoria: payload.categoryId,
      nombre: payload.name.trim(),
      descripcion: payload.description,
      prioridad: payload.priority,
    })
    .eq("id", problemTypeId);
  if (error) throw error;
};

export const setProblemTypeActive = async (
  problemTypeId: string,
  isActive: boolean,
) => {
  const { error } = await supabase
    .from("ticket_tipos_problemas")
    .update({ activo: isActive })
    .eq("id", problemTypeId);
  if (error) throw error;
};

export const getCatalogMutationErrorMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (code === "23505" || message.includes("duplicate")) {
    return "Ya existe un registro con ese nombre en el mismo contexto.";
  }
  if (code === "23503") {
    return "El registro está relacionado con datos que ya no están disponibles.";
  }
  if (code === "23514") {
    return "Uno de los valores no cumple las reglas permitidas.";
  }
  if (code === "42501" || message.includes("permission")) {
    return "Tu cuenta no tiene permiso para modificar este catálogo.";
  }

  return "No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.";
};
