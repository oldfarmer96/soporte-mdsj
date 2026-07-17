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
      status: "initializing",
      setUser: (user: User) =>
        set({
          user,
          isAuth: true,
          status: "authenticated",
        }),
      clearAuth: () => {
        set({
          user: null,
          isAuth: false,
          status: "unauthenticated",
        });
      },
    }),
    {
      name: STORAGE_NAME,
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
