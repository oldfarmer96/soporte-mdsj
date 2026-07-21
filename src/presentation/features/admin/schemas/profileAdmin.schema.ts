import { z } from "zod";

export const profileAccessSchema = z.object({
  role: z.enum(["SOLICITANTE", "APOYO", "ADMIN"]),
  status: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
});

export type ProfileAccessForm = z.infer<typeof profileAccessSchema>;
