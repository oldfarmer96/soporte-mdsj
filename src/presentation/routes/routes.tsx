import { createBrowserRouter } from "react-router-dom";
import {
  AdminPage,
  LoginPage,
  ModulePendingPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  RequesterPage,
  SupportPage,
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
import {
  ClipboardCheck,
  FolderKanban,
  ListTree,
  MapPin,
  Plus,
  Tags,
  UsersRound,
} from "lucide-react";

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
            <ModulePendingPage
              title="Nuevo ticket"
              description="Registra una nueva incidencia para que el personal de apoyo pueda atenderla."
              section="Solicitante"
              icon={Plus}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/tickets",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Mis tickets"
              description="Consulta el estado y la atención de las solicitudes que registraste."
              section="Solicitante"
              icon={FolderKanban}
            />
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
            <ModulePendingPage
              title="Cola de tickets"
              description="Consulta y organiza las solicitudes pendientes de atención."
              section="Personal de apoyo"
              icon={FolderKanban}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/apoyo/asignados",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Mis asignados"
              description="Revisa las solicitudes que se encuentran bajo tu responsabilidad."
              section="Personal de apoyo"
              icon={ClipboardCheck}
            />
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
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Tickets"
              description="Consulta general de las solicitudes registradas en la mesa de soporte."
              section="Administración"
              icon={FolderKanban}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/usuarios",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Usuarios"
              description="Consulta los perfiles y sus condiciones de acceso al sistema."
              section="Administración"
              icon={UsersRound}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/areas",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Áreas"
              description="Administra las áreas y ubicaciones utilizadas para registrar tickets."
              section="Administración"
              icon={MapPin}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/categorias",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Categorías"
              description="Administra las categorías generales de las solicitudes de soporte."
              section="Administración"
              icon={Tags}
            />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/admin/tipos-problema",
        errorElement: <RouteErrorPage />,
        element: (
          <LazyPageSuspense>
            <ModulePendingPage
              title="Tipos de problema"
              description="Administra la clasificación detallada y su prioridad base."
              section="Administración"
              icon={ListTree}
            />
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
