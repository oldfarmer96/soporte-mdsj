import type { AuthStore } from "@/shared/interfaces/authStore.interface";
import type { User } from "@/shared/interfaces/userAuthStore.interface";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_NAME = "support-storage";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuth: false,
      setUser: (user: User) =>
        set({
          user,
          isAuth: true,
        }),
      logOut: () => {
        set({
          user: null,
          isAuth: false,
        });

        localStorage.removeItem(STORAGE_NAME);
      },
    }),
    {
      name: STORAGE_NAME,
    },
  ),
);
