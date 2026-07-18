import type {
  Area,
  CatalogQueryOptions,
  Category,
  ProblemType,
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
