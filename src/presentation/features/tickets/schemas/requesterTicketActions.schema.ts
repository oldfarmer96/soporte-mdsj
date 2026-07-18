import { z } from "zod";

const reasonSchema = z
  .string()
  .trim()
  .min(5, "Explica el motivo con al menos 5 caracteres")
  .max(1000, "El motivo debe tener como máximo 1000 caracteres");

export const rejectSolutionSchema = z.object({ reason: reasonSchema });
export const reopenTicketSchema = z.object({ reason: reasonSchema });

export type RejectSolutionForm = z.infer<typeof rejectSolutionSchema>;
export type ReopenTicketForm = z.infer<typeof reopenTicketSchema>;
