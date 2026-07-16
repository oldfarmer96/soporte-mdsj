import type { User } from "./userAuthStore.interface";

export interface AuthStore {
  user: User | null;
  isAuth: boolean;

  setUser: (user: User) => void;
  logOut: () => void;
}
