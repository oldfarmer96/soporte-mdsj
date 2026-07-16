import type { LoginT } from "@/presentation/features/auth/schemas/login.schema";
import type { RegisterT } from "@/presentation/features/auth/schemas/register.schema";
import {
  getAuthErrorMessage,
  loginWithDni,
  registerWithDni,
} from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth-store";
import { useNavigate } from "react-router-dom";
import { roleBasedRedirection } from "@/shared/utils/roleBasedRedirection";

const TOAST_IDS = {
  login: "toast-login",
  register: "toast-register",
  logout: "toast-logout",
} as const;

export const useLogin = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["login"],
    mutationFn: (data: LoginT) => loginWithDni(data),
    onSuccess: (data) => {
      toast.success("Inicio de sesión exitoso", { id: TOAST_IDS.login });
      setUser(data);
      navigate(roleBasedRedirection(data.role), {
        replace: true,
      });
    },
    onError: (err) => {
      toast.error(getAuthErrorMessage(err.message), {
        id: TOAST_IDS.login,
      });
    },
  });
};

export const useRegister = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["register"],
    mutationFn: (data: RegisterT) => registerWithDni(data),
    onSuccess: (data) => {
      toast.success("Cuenta creada correctamente", {
        id: TOAST_IDS.register,
      });
      setUser({
        dni: data.dni,
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
      });

      navigate(roleBasedRedirection(data.role), { replace: true });
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error.message), {
        id: TOAST_IDS.register,
      });
    },
  });
};
