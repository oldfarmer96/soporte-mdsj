import { profileKeys } from "@/application/queryKeys/profile.queryKeys";
import type {
  ProfileListFilters,
  UpdateProfileAccessInput,
} from "@/shared/interfaces/profile.interface";
import {
  changeOwnPassword,
  getProfileMutationErrorMessage,
  getProfiles,
  updateProfileAccess,
  updateOwnProfile,
} from "@/services/profile.service";
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

export const useUpdateProfileAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["update-profile-access"],
    mutationFn: (input: UpdateProfileAccessInput) =>
      updateProfileAccess(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Acceso del usuario actualizado");
    },
    onError: (error) => toast.error(getProfileMutationErrorMessage(error)),
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
