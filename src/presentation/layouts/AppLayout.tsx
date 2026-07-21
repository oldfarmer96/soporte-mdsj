import type { RoleNavigation } from "@/presentation/navigation/navigation";
import { getActiveNavigationItem } from "@/presentation/navigation/navigation";
import { useRef, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import Sidebar from "../components/Sidebar";

interface AppLayoutProps {
  navigation: RoleNavigation;
  headerTools?: ReactNode;
}

const AppLayout = ({ navigation, headerTools }: AppLayoutProps) => {
  const drawerToggleRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  const activeItem = getActiveNavigationItem(pathname, navigation);
  const drawerId = `navigation-${navigation.shortLabel.toLowerCase().replaceAll(" ", "-")}`;

  const closeDrawer = () => {
    if (drawerToggleRef.current) drawerToggleRef.current.checked = false;
  };

  return (
    <div className="drawer min-h-screen bg-base-200 lg:drawer-open">
      <input
        ref={drawerToggleRef}
        id={drawerId}
        type="checkbox"
        className="drawer-toggle"
      />
      <div className="drawer-content flex min-w-0 flex-col">
        <a
          href="#main-content"
          className="btn btn-sm absolute left-3 top-3 z-50 -translate-y-20 focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <AppHeader
          activeItem={activeItem}
          drawerId={drawerId}
          section={navigation.label}
          tools={headerTools}
        />
        <main id="main-content" className="min-w-0 grow" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40 lg:z-20">
        <label
          htmlFor={drawerId}
          aria-label="Cerrar navegación"
          className="drawer-overlay"
        />
        <Sidebar
          navigation={navigation}
          drawerId={drawerId}
          onNavigate={closeDrawer}
        />
      </div>
    </div>
  );
};

export default AppLayout;
