import type { RoleNavigation } from "@/presentation/navigation/navigation";
import { Headphones, X } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  navigation: RoleNavigation;
  drawerId: string;
  onNavigate: () => void;
}

const Sidebar = ({ navigation, drawerId, onNavigate }: SidebarProps) => (
  <aside className="flex min-h-full w-80 flex-col border-r border-base-300 bg-base-100 text-base-content lg:w-72">
    <div className="flex min-h-20 items-center gap-3 border-b border-base-300 px-4 lg:px-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-sm">
        <Headphones className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 grow">
        <p className="truncate text-sm font-black">Soporte</p>
        <p className="truncate text-xs text-base-content/60">MDSJ</p>
      </div>
      <label
        htmlFor={drawerId}
        className="btn btn-ghost btn-square lg:hidden"
        aria-label="Cerrar navegación"
      >
        <X className="size-5" aria-hidden="true" />
      </label>
    </div>

    <div className="px-4 pb-2 pt-5">
      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
        {navigation.shortLabel}
      </p>
    </div>

    <nav
      className="grow overflow-y-auto px-3 pb-5"
      aria-label="Navegación principal"
    >
      <ul className="menu w-full gap-1 p-0">
        {navigation.items.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `min-h-12 gap-3 rounded-xl ${isActive ? "menu-active font-bold" : ""}`
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
