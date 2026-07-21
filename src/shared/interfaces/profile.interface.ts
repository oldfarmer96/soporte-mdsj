import type { RoleT } from "../types/role.types";

export type ProfileStatus = "ACTIVO" | "INACTIVO" | "BLOQUEADO";

export interface ProfileListItem {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: RoleT;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileListFilters {
  page: number;
  pageSize: number;
  search?: string;
  role?: RoleT;
  status?: ProfileStatus;
}

export interface PaginatedProfiles {
  items: ProfileListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateProfileAccessInput {
  profileId: string;
  role: RoleT;
  status: ProfileStatus;
}
