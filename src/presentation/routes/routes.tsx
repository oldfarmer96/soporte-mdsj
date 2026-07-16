import { createBrowserRouter } from "react-router-dom";
import {
  LoginPage,
  NotFoundPage,
  RegisterPage,
  RequesterPage,
} from "./lazyPages";
import RequesterLayout from "../layouts/RequesterLayout";
import AuthLayout from "../layouts/AuthLayout";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import LazyPageSuspense from "../components/LazyPageSuspense";

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
        <RequesterLayout />
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
    path: "*",
    element: (
      <LazyPageSuspense>
        <NotFoundPage />
      </LazyPageSuspense>
    ),
  },
]);
