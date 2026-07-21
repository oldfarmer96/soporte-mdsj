import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const areaFormSchema = z.object({
  name: z.string().min(2, "Ingresa al menos 2 caracteres").max(150),
  shortName: optionalText(30, "Usa como máximo 30 caracteres"),
  floor: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^-?\d+$/.test(value) && Number(value) >= -2 && Number(value) <= 20),
      "El piso debe ser un entero entre -2 y 20",
    ),
  reference: optionalText(250, "Usa como máximo 250 caracteres"),
});

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Ingresa al menos 2 caracteres").max(100),
  description: optionalText(300, "Usa como máximo 300 caracteres"),
  isCritical: z.boolean(),
});

export const subareaFormSchema = z.object({
  areaId: z.uuid("Selecciona un área"),
  name: z.string().min(2, "Ingresa al menos 2 caracteres").max(150),
  shortName: optionalText(30, "Usa como máximo 30 caracteres"),
  description: optionalText(300, "Usa como máximo 300 caracteres"),
});

export const problemTypeFormSchema = z.object({
  categoryId: z.uuid("Selecciona una categoría"),
  name: z.string().min(2, "Ingresa al menos 2 caracteres").max(150),
  description: optionalText(300, "Usa como máximo 300 caracteres"),
  priority: z.enum(["BAJO", "MEDIO", "ALTO", "CRITICO"]),
});

export type AreaForm = z.infer<typeof areaFormSchema>;
export type CategoryForm = z.infer<typeof categoryFormSchema>;
export type SubareaForm = z.infer<typeof subareaFormSchema>;
export type ProblemTypeForm = z.infer<typeof problemTypeFormSchema>;
