import { z } from "zod";

export const registerSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Ingresa un DNI válido de 8 dígitos"),
});

export type RegisterT = z.infer<typeof registerSchema>;
