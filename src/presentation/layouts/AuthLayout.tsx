import { Headphones } from "lucide-react";
import { Outlet } from "react-router-dom";
import ToggleTheme from "../components/ToggleTheme";

const AuthLayout = () => {
  return (
    <>
      <header className="rounded-box bg-base-100/80 shadow-sm backdrop-blur flex  justify-between items-center px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-content">
            <Headphones className="size-5" aria-hidden="true" />
          </span>
          <div className="hidden sm:block">
            <p className="font-bold">Mesa de soporte MDSJ</p>
          </div>
        </div>
        <ToggleTheme />
      </header>

      <main className="text-base-content">
        <Outlet />
      </main>
    </>
  );
};

export default AuthLayout;
