import type { ProfileStatus } from "@/shared/interfaces/profile.interface";
import type { RoleT } from "@/shared/types/role.types";

const ROLE_LABELS: Record<RoleT, string> = {
  SOLICITANTE: "Solicitante",
  APOYO: "Personal de apoyo",
  ADMIN: "Administrador",
};
const ROLE_STYLES: Record<RoleT, string> = {
  SOLICITANTE: "badge-ghost",
  APOYO: "badge-info badge-soft",
  ADMIN: "badge-secondary badge-soft",
};
const STATUS_LABELS: Record<ProfileStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  BLOQUEADO: "Bloqueado",
};
const STATUS_STYLES: Record<ProfileStatus, string> = {
  ACTIVO: "badge-success badge-soft",
  INACTIVO: "badge-neutral badge-outline",
  BLOQUEADO: "badge-error badge-soft",
};

export const ProfileRoleBadge = ({ role }: { role: RoleT }) => (
  <span className={`badge ${ROLE_STYLES[role]}`}>{ROLE_LABELS[role]}</span>
);

export const ProfileStatusBadge = ({ status }: { status: ProfileStatus }) => (
  <span className={`badge gap-1.5 ${STATUS_STYLES[status]}`}>
    <span
      className={`status ${
        status === "ACTIVO"
          ? "status-success"
          : status === "BLOQUEADO"
            ? "status-error"
            : "status-neutral"
      }`}
      aria-hidden="true"
    />
    {STATUS_LABELS[status]}
  </span>
);
