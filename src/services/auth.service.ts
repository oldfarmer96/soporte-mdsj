import type { LoginT } from "@/presentation/features/auth/schemas/login.schema";
import type { RegisterT } from "@/presentation/features/auth/schemas/register.schema";
import type { User } from "@/shared/interfaces/userAuthStore.interface";
import { isValidRole } from "@/shared/utils/roles.validator";
import { supabase } from "@/shared/utils/supabase";

const getInstitutionalEmail = (dni: string) => `${dni}@mdsj.com`;

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

  const { data: profile, error: profileError } = await supabase
    .from("perfiles")
    .select("dni, nombres, apellidos, telefono, rol, estado")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }

  if (profile.estado !== "ACTIVO") {
    await supabase.auth.signOut();
    throw new Error("Perfil inactivo");
  }

  if (!isValidRole(profile.rol)) {
    throw new Error(`Rol inválido: ${profile.rol}`);
  }

  return {
    dni: profile.dni,
    name: profile.nombres,
    lastName: profile.apellidos,
    email: authData.user.email ?? getInstitutionalEmail(profile.dni),
    phone: profile.telefono,
    role: profile.rol,
  };
};

export const registerWithDni = async ({
  dni,
  nombres,
  apellidos,
  telefono,
}: RegisterT): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email: getInstitutionalEmail(dni),
    password: dni,
    options: {
      data: {
        dni,
        nombres,
        apellidos,
        telefono: telefono || null,
      },
    },
  });

  if (error) throw error;

  if (data.user?.identities?.length === 0) {
    throw new Error("Usuario ya registrado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("perfiles")
    .select("dni, nombres, apellidos, telefono, rol, estado")
    .eq("id", data.user?.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }

  if (profile.estado !== "ACTIVO") {
    await supabase.auth.signOut();
    throw new Error("Perfil inactivo");
  }

  if (!isValidRole(profile.rol)) {
    throw new Error(`Rol inválido: ${profile.rol}`);
  }

  return {
    dni: profile.dni,
    name: profile.nombres,
    lastName: profile.apellidos,
    email: data.user?.email ?? getInstitutionalEmail(profile.dni),
    phone: profile.telefono,
    role: profile.rol,
  };
};

export const getAuthErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "El DNI o la contraseña son incorrectos.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "Ya existe una cuenta registrada con este DNI.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "La cuenta todavía no está habilitada para iniciar sesión.";
  }

  if (normalizedMessage.includes("inactive profile")) {
    return "Tu cuenta está inactiva o bloqueada. Contacta con soporte.";
  }

  return "No pudimos completar la solicitud. Inténtalo nuevamente.";
};
