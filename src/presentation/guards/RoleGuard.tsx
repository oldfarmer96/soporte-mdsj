import { useAuthStore } from "@/application/store/auth-store";
import type { RoleT } from "@/shared/types/role.types";
import { roleBasedRedirection } from "@/shared/utils/roleBasedRedirection";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import AuthLoadingScreen from "../components/AuthLoadingScreen";

interface RoleGuardProps extends PropsWithChildren {
  allowedRoles: RoleT[];
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { status, user } = useAuthStore();

  if (status === "initializing") {
    return <AuthLoadingScreen />;
  }

  if (!user || status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleBasedRedirection(user.role)} replace />;
  }

  return children;
};

export default RoleGuard;
