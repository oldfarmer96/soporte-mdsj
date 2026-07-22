import type { NavigationItem } from "@/presentation/navigation/navigation";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import ToggleTheme from "./ToggleTheme";
import UserMenu from "./UserMenu";

interface AppHeaderProps {
  activeItem?: NavigationItem;
  drawerId: string;
  section: string;
  tools?: ReactNode;
}

const AppHeader = ({ activeItem, drawerId, section, tools }: AppHeaderProps) => (
  <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
    <div className="navbar mx-auto min-h-16 max-w-[100rem] gap-2 px-3 sm:px-5 lg:px-8">
      <div className="navbar-start min-w-0 gap-2">
        <label
          htmlFor={drawerId}
          className="btn btn-ghost btn-square lg:hidden"
          aria-label="Abrir navegación"
        >
          <Menu className="size-5" aria-hidden="true" />
        </label>
        <div className="min-w-0">
          <p className="truncate text-sm font-black sm:text-base">
            {activeItem?.label ?? section}
          </p>
          <p className="hidden truncate text-xs text-base-content/55 sm:block">
            {section}
          </p>
        </div>
      </div>

      <div className="navbar-end gap-1 sm:gap-2">
        {tools}
        <ToggleTheme />
        <UserMenu />
      </div>
    </div>
  </header>
);

export default AppHeader;
