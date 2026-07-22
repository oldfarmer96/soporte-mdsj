import { profileKeys } from "@/application/queryKeys/profile.queryKeys";
import type {
  ProfileListFilters,
  UpdateManagedProfileInput,
} from "@/shared/interfaces/profile.interface";
import {
  changeOwnPassword,
  getProfileMutationErrorMessage,
  getProfile,
  getProfiles,
  updateManagedProfile,
  updateOwnProfile,
} from "@/services/profile.service";
import {
  checkLocalAdminApi,
  lookupDni,
  resetProfilePassword,
} from "@/services/local-admin.service";
import type {
  ChangePasswordT,
  PersonalDataT,
} from "@/presentation/features/shared/schemas/profile.schema";
import { useAuthStore } from "../store/auth-store";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useProfiles = (filters: ProfileListFilters) =>
  useQuery({
    queryKey: profileKeys.list(filters),
    queryFn: () => getProfiles(filters),
    placeholderData: keepPreviousData,
    retry: 2,
  });

export const useProfile = (profileId: string) =>
  useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => getProfile(profileId),
    enabled: Boolean(profileId),
    retry: 1,
  });

export const useUpdateManagedProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["update-managed-profile"],
    mutationFn: (input: UpdateManagedProfileInput) =>
      updateManagedProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Datos del usuario actualizados");
    },
    onError: (error) => toast.error(getProfileMutationErrorMessage(error)),
  });
};

export const useLocalAdminApiStatus = () =>
  useQuery({
    queryKey: ["local-admin-api", "health"],
    queryFn: checkLocalAdminApi,
    retry: false,
    staleTime: 30_000,
  });

export const useDniLookup = () =>
  useMutation({
    mutationKey: ["local-admin-api", "dni-lookup"],
    mutationFn: lookupDni,
    onError: (error) => toast.error(error.message),
  });

export const useResetProfilePassword = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationKey: ["local-admin-api", "reset-password"],
    mutationFn: resetProfilePassword,
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      if (user?.id === profileId) setUser({ ...user, mustChangePassword: true });
      toast.success("Contraseña restablecida al DNI");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdateOwnProfile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationKey: ["update-own-profile"],
    mutationFn: (input: PersonalDataT) => updateOwnProfile(input),
    onSuccess: (_, input) => {
      if (user) {
        setUser({
          ...user,
          name: input.nombres.trim(),
          lastName: input.apellidos.trim(),
          phone: input.telefono.trim(),
        });
      }
      toast.success("Datos personales actualizados");
    },
    onError: () => toast.error("No pudimos actualizar tus datos."),
  });
};

export const useChangeOwnPassword = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationKey: ["change-own-password"],
    mutationFn: (input: ChangePasswordT) => changeOwnPassword(input),
    onSuccess: () => {
      if (user) setUser({ ...user, mustChangePassword: false });
      toast.success("Contraseña actualizada");
    },
    onError: () => toast.error("No pudimos actualizar tu contraseña."),
  });
};
