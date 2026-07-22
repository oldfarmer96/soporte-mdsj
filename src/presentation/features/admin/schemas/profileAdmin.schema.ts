import { z } from "zod";

const optionalName = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Ingresa al menos 2 caracteres o deja el campo vacío",
    });

export const managedProfileSchema = z.object({
  firstName: optionalName(100),
  lastName: optionalName(150),
  phone: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^[0-9+]{9,15}$/.test(value), {
      message: "Ingresa un teléfono válido de 9 a 15 caracteres",
    }),
  role: z.enum(["SOLICITANTE", "APOYO", "ADMIN"]),
  status: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
});

export type ManagedProfileForm = z.infer<typeof managedProfileSchema>;
