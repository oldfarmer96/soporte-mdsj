import type { RoleT } from "../types/role.types";

export const roleBasedRedirection = (role: RoleT) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "APOYO":
      return "/apoyo";
    case "SOLICITANTE":
      return "/";
    default:
      return "/login";
  }
};
