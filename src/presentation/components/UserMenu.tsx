import { useLogout } from "@/application/hooks/useAuth";
import { useAuthStore } from "@/application/store/auth-store";
import { LogOut, UserRound } from "lucide-react";

const ROLE_LABELS = {
  SOLICITANTE: "Solicitante",
  APOYO: "Personal de apoyo",
  ADMIN: "Administrador",
} as const;

const UserMenu = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  if (!user) return null;

  const initials = `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost h-auto min-h-11 gap-3 px-2 sm:px-3">
        <span className="avatar avatar-placeholder">
          <span className="grid size-9 place-items-center rounded-full bg-neutral text-sm font-bold text-neutral-content">
            {initials}
          </span>
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-44 truncate text-sm font-bold">
            {user.name} {user.lastName}
          </span>
          <span className="block text-xs font-normal text-base-content/60">
            {ROLE_LABELS[user.role]}
          </span>
        </span>
      </summary>

      <ul className="menu dropdown-content z-20 mt-3 w-72 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
        <li className="menu-title px-3 py-2">
          <span className="flex items-center gap-2 text-base-content">
            <UserRound className="size-4" aria-hidden="true" />
            Mi cuenta
          </span>
        </li>
        <li className="pointer-events-none px-3 pb-2 text-xs text-base-content/60">
          <span className="block truncate">DNI {user.dni}</span>
        </li>
        <li>
          <button
            type="button"
            className="text-error"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </li>
      </ul>
    </details>
  );
};

export default UserMenu;
