import { createBrowserRouter } from "react-router-dom";
import {
  AdminPage,
  LoginPage,
  NotFoundPage,
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
          <LazyPageSuspense>
            <LoginPage />
          </LazyPageSuspense>
        ),
      },
      {
        path: "/register",
        element: (
          <LazyPageSuspense>
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
        element: (
          <LazyPageSuspense>
            <RequesterPage />
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
        element: (
          <LazyPageSuspense>
            <SupportPage />
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
        element: (
          <LazyPageSuspense>
            <AdminPage />
          </LazyPageSuspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <LazyPageSuspense>
        <NotFoundPage />
      </LazyPageSuspense>
    ),
  },
]);
