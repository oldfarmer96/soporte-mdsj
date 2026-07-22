const localApiUrl = (import.meta.env.VITE_LOCAL_ADMIN_API_URL || "http://localhost:6300")
  .replace(/\/$/, "");

interface LocalApiMessage {
  message: string;
}

export interface DniLookupResult {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  codigo_verificacion: string;
}

interface DniLookupResponse {
  estado: boolean;
  mensaje: string;
  resultado: DniLookupResult | null;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${localApiUrl}${path}`, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
    signal: AbortSignal.timeout(5_000),
  });
  const body = (await response.json().catch(() => null)) as LocalApiMessage | T | null;
  if (!response.ok) {
    throw new Error(
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : "El servicio local no pudo completar la solicitud",
    );
  }
  return body as T;
};

export const checkLocalAdminApi = async () => {
  const result = await request<LocalApiMessage>("/health");
  if (result.message !== "ok") throw new Error("Respuesta de estado no válida");
  return true;
};

export const lookupDni = async (dni: string) => {
  const response = await request<DniLookupResponse>("/dni/lookup", {
    method: "POST",
    body: JSON.stringify({ dni }),
  });
  if (!response.estado || !response.resultado) {
    throw new Error(response.mensaje || "No se encontraron datos para el DNI");
  }
  return response.resultado;
};

export const resetProfilePassword = (profileId: string) =>
  request<LocalApiMessage>(`/users/${profileId}/reset-password`, {
    method: "POST",
  });
