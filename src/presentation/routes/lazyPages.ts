import { lazy } from "react";

export const RequesterPage = lazy(
  () => import("@/presentation/features/requester/page/RequesterPage"),
);

export const LoginPage = lazy(
  () => import("@/presentation/features/auth/pages/LoginPage"),
);

export const RegisterPage = lazy(
  () => import("@/presentation/features/auth/pages/RegisterPage"),
);

export const SupportPage = lazy(
  () => import("@/presentation/features/support/pages/SupportPage"),
);

export const AdminPage = lazy(
  () => import("@/presentation/features/admin/pages/AdminPage"),
);

export const NotFoundPage = lazy(
  () => import("@/presentation/features/errors/pages/NotFoundPage"),
);

export const ModulePendingPage = lazy(
  () => import("@/presentation/features/shared/pages/ModulePendingPage"),
);

export const ProfilePage = lazy(
  () => import("@/presentation/features/shared/pages/ProfilePage"),
);
