import { z } from "zod";

export const loginSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Ingresa un DNI válido de 8 dígitos"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginT = z.infer<typeof loginSchema>;
