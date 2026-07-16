import { Outlet } from "react-router-dom";
import ToggleTheme from "../components/ToggleTheme";

const RequesterLayout = () => {
  return (
    <>
      <header className="flex justify-end items-end">
        <ToggleTheme />
      </header>
      <Outlet />
    </>
  );
};

export default RequesterLayout;
