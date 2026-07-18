import { z } from "zod";

const requiredUuid = (message: string) => z.string().uuid(message);

export const createTicketSchema = z.object({
  areaId: requiredUuid("Selecciona un área"),
  categoryId: requiredUuid("Selecciona una categoría"),
  problemTypeId: z
    .union([z.string().uuid("Selecciona un tipo de problema válido"), z.literal("")]),
  subject: z
    .string()
    .trim()
    .min(3, "El asunto debe tener al menos 3 caracteres")
    .max(150, "El asunto debe tener como máximo 150 caracteres"),
  description: z
    .string()
    .trim()
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(3000, "La descripción debe tener como máximo 3000 caracteres"),
  impact: z.enum(
    ["INDIVIDUAL", "USUARIOS_MULTIPLES", "TODA_EL_AREA", "SERVICIO_INTERRUMPIDO"],
    { error: "Selecciona el impacto del problema" },
  ),
  workStopped: z.boolean(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
