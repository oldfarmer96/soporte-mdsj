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

export const NotFoundPage = lazy(
  () => import("@/presentation/features/errors/pages/NotFoundPage"),
);
