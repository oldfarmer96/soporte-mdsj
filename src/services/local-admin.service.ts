const localApiUrl = (import.meta.env.VITE_LOCAL_ADMIN_API_URL || "http://localhost:6300")
  .replace(/\/$/, "");

interface LocalApiMessage {
  message: string;
}

export interface DniLookupResult {
  dni: string;
  nombres: string;
  apellidos: string;
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

export const lookupDni = (dni: string) =>
  request<DniLookupResult>("/dni/lookup", {
    method: "POST",
    body: JSON.stringify({ dni }),
  });

export const resetProfilePassword = (profileId: string) =>
  request<LocalApiMessage>(`/users/${profileId}/reset-password`, {
    method: "POST",
  });
