import { Headphones } from "lucide-react";
import { Outlet } from "react-router-dom";
import ToggleTheme from "../components/ToggleTheme";
import UserMenu from "../components/UserMenu";

interface AppLayoutProps {
  section: string;
}

const AppLayout = ({ section }: AppLayoutProps) => (
  <div className="min-h-screen bg-base-200">
    <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content">
            <Headphones className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold sm:text-base">
              Mesa de soporte MDSJ
            </p>
            <p className="truncate text-xs text-base-content/60">{section}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ToggleTheme />
          <UserMenu />
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
