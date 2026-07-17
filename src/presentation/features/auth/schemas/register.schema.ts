import { z } from "zod";

export const registerSchema = z
  .object({
    dni: z
      .string()
      .trim()
      .regex(/^\d{8}$/, "Ingresa un DNI válido de 8 dígitos"),
    nombres: z
      .string()
      .trim()
      .min(2, "Ingresa al menos 2 caracteres")
      .max(100, "Ingresa como máximo 100 caracteres"),
    apellidos: z
      .string()
      .trim()
      .min(2, "Ingresa al menos 2 caracteres")
      .max(150, "Ingresa como máximo 150 caracteres"),
    telefono: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[0-9+]{9,15}$/.test(value),
        "Ingresa un teléfono válido de 9 a 15 caracteres",
      ),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña debe tener como máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterT = z.infer<typeof registerSchema>;
