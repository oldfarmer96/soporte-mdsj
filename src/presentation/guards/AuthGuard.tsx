import { useAuthStore } from "@/application/store/auth-store";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import AuthLoadingScreen from "../components/AuthLoadingScreen";

const AuthGuard = ({ children }: PropsWithChildren) => {
  const { isAuth, status, user } = useAuthStore();

  if (status === "initializing") {
    return <AuthLoadingScreen />;
  }

  if (status !== "authenticated" || !isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;
