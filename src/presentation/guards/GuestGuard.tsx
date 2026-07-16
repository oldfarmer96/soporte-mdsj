import { useAuthStore } from "@/application/store/auth-store";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

const GuestGuard = ({ children }: PropsWithChildren) => {
  const { isAuth, user } = useAuthStore();

  if (isAuth && user) {
    // TODO: despues resa basado en roles
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestGuard;
