import { z } from "zod";

const requiredUuid = (message: string) => z.string().uuid(message);

export const createTicketSchema = z.object({
  areaId: requiredUuid("Selecciona un área"),
  subareaId: requiredUuid("Selecciona una subárea"),
  categoryId: requiredUuid("Selecciona una categoría"),
  problemTypeId: requiredUuid("Selecciona un tipo de problema"),
  description: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || value.length >= 5,
      "Escribe al menos 5 caracteres o deja la descripción vacía",
    )
    .max(3000, "La descripción debe tener como máximo 3000 caracteres"),
  impact: z.enum(
    ["INDIVIDUAL", "USUARIOS_MULTIPLES", "TODA_EL_AREA", "SERVICIO_INTERRUMPIDO"],
    { error: "Selecciona el impacto del problema" },
  ),
  workStopped: z.boolean(),
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;
