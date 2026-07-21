import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  AdminPage,
  AreasPage,
  CategoriesPage,
  CreateTicketPage,
  LoginPage,
  MyTicketsPage,
  NotFoundPage,
  ProfilePage,
  ProblemTypesPage,
  ProfilesPage,
  RegisterPage,
  RequesterPage,
  SupportPage,
  SupportTicketDetailPage,
  SupportTicketsPage,
  SubareasPage,
  TicketCreatedPage,
} from "./lazyPages";
import RequesterLayout from "../layouts/RequesterLayout";
import AuthLayout from "../layouts/AuthLayout";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import LazyPageSuspense from "../components/LazyPageSuspense";
import RoleGuard from "../guards/RoleGuard";
import SupportLayout from "../layouts/SupportLayout";
import AdminLayout from "../layouts/AdminLayout";
import RouteErrorPage from "../features/errors/pages/RouteErrorPage";

export const routes = createBrowserRouter([
  {
    element: (
      <GuestGuard>
        <AuthLayout />
      </GuestGuard>
    ),
    children: [
      {
        path: "/login",
        element: (
          <LazyPageSuspense fullScreen>
            <LoginPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/register",
        element: (
          <LazyPageSuspense fullScreen>
            <RegisterPage />
          </LazyPageSuspense>
        ),
      },
    ],
  },
  {
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["SOLICITANTE"]}>
          <RequesterLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        path: "/",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <RequesterPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/tickets/nuevo",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <CreateTicketPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/tickets/:ticketId",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <TicketCreatedPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/tickets",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <MyTicketsPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/perfil",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ProfilePage />
          </LazyPageSuspense>
        ),
      },
    ],
  },
  {
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["APOYO"]}>
          <SupportLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        path: "/apoyo",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <SupportPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/apoyo/tickets",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <SupportTicketsPage mode="queue" />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/apoyo/asignados",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <SupportTicketsPage mode="mine" />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/apoyo/tickets/:ticketId",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <SupportTicketDetailPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/apoyo/perfil",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ProfilePage />
          </LazyPageSuspense>
        ),
      },
    ],
  },
  {
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["ADMIN"]}>
          <AdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        path: "/admin",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <AdminPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/tickets",
        errorElement: <RouteErrorPage />,
        element: <Navigate to="/admin" replace />,
      },
      {
        path: "/admin/usuarios",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ProfilesPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/areas",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <AreasPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/subareas",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <SubareasPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/categorias",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <CategoriesPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/tipos-problema",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ProblemTypesPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/perfil",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ProfilePage />
          </LazyPageSuspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <LazyPageSuspense fullScreen>
        <NotFoundPage />
      </LazyPageSuspense>
    ),
  },
]);
