import type { RoleT } from "../types/role.types";

const ROLES = ["SOLICITANTE", "APOYO", "ADMIN"] as const;

export function isValidRole(role: string): role is RoleT {
  return ROLES.includes(role as RoleT);
}
