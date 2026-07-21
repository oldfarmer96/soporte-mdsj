import type { RoleT } from "@/shared/types/role.types";
import {
  ClipboardCheck,
  CircleUserRound,
  FolderKanban,
  GitBranch,
  House,
  Inbox,
  ListTree,
  MapPin,
  Plus,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface RoleNavigation {
  label: string;
  shortLabel: string;
  homePath: string;
  profilePath: string;
  items: NavigationItem[];
}

export const NAVIGATION_BY_ROLE: Record<RoleT, RoleNavigation> = {
  SOLICITANTE: {
    label: "Portal del solicitante",
    shortLabel: "Solicitante",
    homePath: "/",
    profilePath: "/perfil",
    items: [
      {
        label: "Inicio",
        description: "Resumen de tu mesa de soporte",
        path: "/",
        icon: House,
        end: true,
      },
      {
        label: "Nuevo ticket",
        description: "Registra una solicitud de soporte",
        path: "/tickets/nuevo",
        icon: Plus,
        end: true,
      },
      {
        label: "Mis tickets",
        description: "Consulta tus solicitudes",
        path: "/tickets",
        icon: FolderKanban,
      },
      {
        label: "Mi perfil",
        description: "Revisa los datos de tu cuenta",
        path: "/perfil",
        icon: CircleUserRound,
      },
    ],
  },
  APOYO: {
    label: "Panel de apoyo",
    shortLabel: "Personal de apoyo",
    homePath: "/apoyo",
    profilePath: "/apoyo/perfil",
    items: [
      {
        label: "Resumen",
        description: "Entrada al espacio operativo",
        path: "/apoyo",
        icon: House,
        end: true,
      },
      {
        label: "Cola de tickets",
        description: "Consulta las solicitudes pendientes",
        path: "/apoyo/tickets",
        icon: Inbox,
      },
      {
        label: "Mis asignados",
        description: "Revisa los tickets a tu cargo",
        path: "/apoyo/asignados",
        icon: ClipboardCheck,
      },
      {
        label: "Mi perfil",
        description: "Revisa los datos de tu cuenta",
        path: "/apoyo/perfil",
        icon: CircleUserRound,
      },
    ],
  },
  ADMIN: {
    label: "Administración",
    shortLabel: "Administrador",
    homePath: "/admin",
    profilePath: "/admin/perfil",
    items: [
      {
        label: "Resumen",
        description: "Entrada al espacio administrativo",
        path: "/admin",
        icon: House,
        end: true,
      },
      {
        label: "Usuarios",
        description: "Consulta los perfiles registrados",
        path: "/admin/usuarios",
        icon: UsersRound,
      },
      {
        label: "Áreas",
        description: "Administra áreas y ubicaciones",
        path: "/admin/areas",
        icon: MapPin,
      },
      {
        label: "Subáreas",
        description: "Administra unidades asociadas a cada área",
        path: "/admin/subareas",
        icon: GitBranch,
      },
      {
        label: "Categorías",
        description: "Administra categorías de soporte",
        path: "/admin/categorias",
        icon: Tags,
      },
      {
        label: "Tipos de problema",
        description: "Administra la clasificación detallada",
        path: "/admin/tipos-problema",
        icon: ListTree,
      },
      {
        label: "Mi perfil",
        description: "Revisa los datos de tu cuenta",
        path: "/admin/perfil",
        icon: CircleUserRound,
      },
    ],
  },
};

export const getActiveNavigationItem = (
  pathname: string,
  navigation: RoleNavigation,
) =>
  navigation.items
    .filter((item) =>
      item.end
        ? pathname === item.path
        : pathname === item.path || pathname.startsWith(`${item.path}/`),
    )
    .sort((first, second) => second.path.length - first.path.length)[0];
