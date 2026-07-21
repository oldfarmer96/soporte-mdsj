import type { LoginT } from "@/presentation/features/auth/schemas/login.schema";
import type { RegisterT } from "@/presentation/features/auth/schemas/register.schema";
import type { User } from "@/shared/interfaces/userAuthStore.interface";
import { isValidRole } from "@/shared/utils/roles.validator";
import { supabase } from "@/shared/utils/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const getInstitutionalEmail = (dni: string) => `${dni}@mdsj.com`;

const getProfile = async (authUser: SupabaseUser): Promise<User> => {
  const { data: profile, error } = await supabase
    .from("perfiles")
    .select("dni, nombres, apellidos, telefono, rol, estado, debe_cambiar_password")
    .eq("id", authUser.id)
    .single();

  if (error) throw error;
  if (profile.estado !== "ACTIVO") throw new Error("Perfil inactivo");
  if (!isValidRole(profile.rol)) {
    throw new Error(`Rol inválido: ${profile.rol}`);
  }

  return {
    dni: profile.dni,
    name: profile.nombres ?? "",
    lastName: profile.apellidos ?? "",
    email: authUser.email ?? getInstitutionalEmail(profile.dni),
    phone: profile.telefono,
    role: profile.rol,
    mustChangePassword: profile.debe_cambiar_password,
  };
};

export const loginWithDni = async ({
  dni,
  password,
}: LoginT): Promise<User> => {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: getInstitutionalEmail(dni),
      password,
    });

  if (authError) throw authError;

  try {
    return await getProfile(authData.user);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
};

export const registerWithDni = async ({ dni }: RegisterT): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email: getInstitutionalEmail(dni),
    password: dni,
    options: {
      data: {
        dni,
      },
    },
  });

  if (error) throw error;

  if (data.user?.identities?.length === 0) {
    throw new Error("Usuario ya registrado");
  }

  if (!data.user || !data.session) {
    throw new Error("Registro sin sesión activa");
  }

  try {
    return await getProfile(data.user);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
};

export const getCurrentUserProfile = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) return null;

  return getProfile(data.user);
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getAuthErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "El DNI o la contraseña son incorrectos.";
  }

  if (
    normalizedMessage.includes("user already registered") ||
    normalizedMessage.includes("usuario ya registrado")
  ) {
    return "Ya existe una cuenta registrada con este DNI.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "La cuenta todavía no está habilitada para iniciar sesión.";
  }

  if (
    normalizedMessage.includes("inactive profile") ||
    normalizedMessage.includes("perfil inactivo")
  ) {
    return "Tu cuenta está inactiva o bloqueada. Contacta con soporte.";
  }

  if (normalizedMessage.includes("registro sin sesión activa")) {
    return "La cuenta fue creada, pero Supabase no inició la sesión. Desactiva la confirmación de correo para este flujo.";
  }

  return "No pudimos completar la solicitud. Inténtalo nuevamente.";
};
