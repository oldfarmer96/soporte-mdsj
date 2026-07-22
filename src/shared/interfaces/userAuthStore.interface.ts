import type { RoleT } from "../types/role.types";

export interface User {
  id: string;
  dni: string;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: RoleT;
  mustChangePassword: boolean;
}
