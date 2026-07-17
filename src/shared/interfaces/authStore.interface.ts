import type { User } from "./userAuthStore.interface";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface AuthStore {
  user: User | null;
  isAuth: boolean;
  status: AuthStatus;

  setUser: (user: User) => void;
  clearAuth: () => void;
}
