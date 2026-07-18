import type {
  PaginatedProfiles,
  ProfileListFilters,
  ProfileListItem,
  ProfileStatus,
} from "@/shared/interfaces/profile.interface";
import type { RoleT } from "@/shared/types/role.types";
import { supabase } from "@/shared/utils/supabase";

interface ProfileRow {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  rol: RoleT;
  estado: ProfileStatus;
  created_at: string;
  updated_at: string;
}

const sanitizeSearch = (search: string) =>
  search
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);

export const getProfiles = async (
  filters: ProfileListFilters,
): Promise<PaginatedProfiles> => {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  let query = supabase
    .from("perfiles")
    .select(
      "id, dni, nombres, apellidos, telefono, rol, estado, created_at, updated_at",
      { count: "exact" },
    )
    .order("nombres", { ascending: true })
    .order("apellidos", { ascending: true })
    .order("id", { ascending: true });

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      `dni.ilike.%${search}%,nombres.ilike.%${search}%,apellidos.ilike.%${search}%`,
    );
  }
  if (filters.role) query = query.eq("rol", filters.role);
  if (filters.status) query = query.eq("estado", filters.status);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items: ProfileListItem[] = (data as ProfileRow[]).map((profile) => ({
    id: profile.id,
    dni: profile.dni,
    firstName: profile.nombres,
    lastName: profile.apellidos,
    phone: profile.telefono,
    role: profile.rol,
    status: profile.estado,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
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
