import { z } from "zod";

export const personalDataSchema = z.object({
  nombres: z.string().trim().min(2, "Ingresa al menos 2 caracteres").max(100),
  apellidos: z.string().trim().min(2, "Ingresa al menos 2 caracteres").max(150),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+]{9,15}$/, "Ingresa un teléfono válido de 9 a 15 caracteres"),
});

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Usa al menos 8 caracteres").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type PersonalDataT = z.infer<typeof personalDataSchema>;
export type ChangePasswordT = z.infer<typeof changePasswordSchema>;
