import { z } from "zod";

export const cancelTicketSchema = z.object({
  detail: z
    .string()
    .trim()
    .max(1000, "El motivo debe tener como máximo 1000 caracteres"),
});

export const resolveTicketSchema = z.object({
  diagnosis: z
    .string()
    .trim()
    .max(3000, "El diagnóstico debe tener como máximo 3000 caracteres"),
  solution: z
    .string()
    .trim()
    .min(5, "La solución debe tener al menos 5 caracteres")
    .max(3000, "La solución debe tener como máximo 3000 caracteres"),
});

export type CancelTicketForm = z.infer<typeof cancelTicketSchema>;
export type ResolveTicketForm = z.infer<typeof resolveTicketSchema>;
