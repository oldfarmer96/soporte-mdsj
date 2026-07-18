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

export const AreasPage = lazy(
  () => import("@/presentation/features/catalogs/pages/AreasPage"),
);

export const CategoriesPage = lazy(
  () => import("@/presentation/features/catalogs/pages/CategoriesPage"),
);

export const ProblemTypesPage = lazy(
  () => import("@/presentation/features/catalogs/pages/ProblemTypesPage"),
);

export const CreateTicketPage = lazy(
  () => import("@/presentation/features/tickets/pages/CreateTicketPage"),
);

export const TicketCreatedPage = lazy(
  () => import("@/presentation/features/tickets/pages/TicketCreatedPage"),
);

export const MyTicketsPage = lazy(
  () => import("@/presentation/features/tickets/pages/MyTicketsPage"),
);

export const SupportTicketsPage = lazy(
  () => import("@/presentation/features/support/pages/SupportTicketsPage"),
);

export const SupportTicketDetailPage = lazy(
  () => import("@/presentation/features/support/pages/SupportTicketDetailPage"),
);

export const ProfilesPage = lazy(
  () => import("@/presentation/features/admin/pages/ProfilesPage"),
);
