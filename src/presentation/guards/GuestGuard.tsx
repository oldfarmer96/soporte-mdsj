import { useAuthStore } from "@/application/store/auth-store";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { roleBasedRedirection } from "@/shared/utils/roleBasedRedirection";
import AuthLoadingScreen from "../components/AuthLoadingScreen";

const GuestGuard = ({ children }: PropsWithChildren) => {
  const { isAuth, status, user } = useAuthStore();

  if (status === "initializing") {
    return <AuthLoadingScreen />;
  }

  if (status === "authenticated" && isAuth && user) {
    return <Navigate to={roleBasedRedirection(user.role)} replace />;
  }

  return children;
};

export default GuestGuard;
