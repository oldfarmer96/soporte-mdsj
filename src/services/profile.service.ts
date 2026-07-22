import type {
  PaginatedProfiles,
  ProfileListFilters,
  ProfileListItem,
  ProfileStatus,
  UpdateManagedProfileInput,
} from "@/shared/interfaces/profile.interface";
import type { RoleT } from "@/shared/types/role.types";
import { supabase } from "@/shared/utils/supabase";
import type {
  ChangePasswordT,
  PersonalDataT,
} from "@/presentation/features/shared/schemas/profile.schema";

interface ProfileRow {
  id: string;
  dni: string;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  rol: RoleT;
  estado: ProfileStatus;
  created_at: string;
  updated_at: string;
  debe_cambiar_password: boolean;
}

const mapProfile = (profile: ProfileRow): ProfileListItem => ({
  id: profile.id,
  dni: profile.dni,
  firstName: profile.nombres,
  lastName: profile.apellidos,
  phone: profile.telefono,
  role: profile.rol,
  status: profile.estado,
  mustChangePassword: profile.debe_cambiar_password,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

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
      "id, dni, nombres, apellidos, telefono, rol, estado, debe_cambiar_password, created_at, updated_at",
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

  const items = (data as ProfileRow[]).map(mapProfile);
  const total = count ?? 0;

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
};

export const getProfile = async (profileId: string): Promise<ProfileListItem> => {
  const { data, error } = await supabase
    .from("perfiles")
    .select(
      "id, dni, nombres, apellidos, telefono, rol, estado, debe_cambiar_password, created_at, updated_at",
    )
    .eq("id", profileId)
    .single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
};

export const updateManagedProfile = async ({
  profileId,
  firstName,
  lastName,
  phone,
  role,
  status,
}: UpdateManagedProfileInput) => {
  const { error } = await supabase.rpc("actualizar_perfil_administrador", {
    p_id_perfil: profileId,
    p_nombres: firstName,
    p_apellidos: lastName,
    p_telefono: phone,
    p_rol: role,
    p_estado: status,
  });
  if (error) throw error;
};

export const updateOwnProfile = async (input: PersonalDataT) => {
  const { error } = await supabase.rpc("actualizar_mi_perfil", {
    p_nombres: input.nombres,
    p_apellidos: input.apellidos,
    p_telefono: input.telefono,
  });
  if (error) throw error;
};

export const changeOwnPassword = async ({ password }: ChangePasswordT) => {
  const { error: authError } = await supabase.auth.updateUser({ password });
  if (authError) throw authError;

  const { error } = await supabase.rpc("marcar_password_actualizado");
  if (error) throw error;
};

export const getProfileMutationErrorMessage = (error: unknown) => {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (message.includes("propia cuenta")) {
    return "No puedes modificar tu propia cuenta administrativa.";
  }
  if (message.includes("último administrador")) {
    return "Debe permanecer al menos un administrador activo.";
  }
  if (message.includes("tickets activos")) {
    return "Reasigna los tickets activos antes de cambiar el acceso de este usuario.";
  }
  if (message.includes("permiso")) {
    return "Tu cuenta no tiene permiso para administrar usuarios.";
  }

  return "No pudimos actualizar los datos del usuario.";
};
