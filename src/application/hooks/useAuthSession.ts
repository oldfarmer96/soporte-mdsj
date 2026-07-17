import { useEffect } from "react";
import { getCurrentUserProfile } from "@/services/auth.service";
import { supabase } from "@/shared/utils/supabase";
import { useAuthStore } from "../store/auth-store";

export const useAuthSession = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let active = true;
    let synchronizationId = 0;

    const synchronizeProfile = async () => {
      const currentId = ++synchronizationId;

      try {
        const profile = await getCurrentUserProfile();
        if (!active || currentId !== synchronizationId) return;

        if (profile) {
          setUser(profile);
        } else {
          clearAuth();
        }
      } catch {
        if (!active || currentId !== synchronizationId) return;

        await supabase.auth.signOut();
        clearAuth();
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          synchronizationId += 1;
          clearAuth();
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          window.setTimeout(() => void synchronizeProfile(), 0);
        }
      },
    );

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      if (data.session) {
        void synchronizeProfile();
      } else {
        clearAuth();
      }
    });

    return () => {
      active = false;
      synchronizationId += 1;
      listener.subscription.unsubscribe();
    };
  }, [clearAuth, setUser]);
};
