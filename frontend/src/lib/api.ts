/**
 * Cliente HTTP liviano para la API del backend.
 * En dev, Vite proxya /api → http://localhost:8001 (sin CORS).
 */

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

/** Clave del JWT en localStorage (la misma que persiste AuthContext). */
export const KEY_TOKEN = "dom_token";

function leerToken(): string | null {
  try {
    return localStorage.getItem(KEY_TOKEN);
  } catch {
    return null; // storage bloqueado → peticiones sin token
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    // FastAPI devuelve { detail: string | [...] }
    const detalle = Array.isArray(cuerpo?.detail)
      ? cuerpo.detail.map((d: { msg?: string }) => d.msg).join(", ")
      : (cuerpo?.detail ?? `Error ${res.status}`);
    throw new Error(detalle);
  }

  return res.json() as Promise<T>;
}

/** Agrega el Bearer del JWT si hay sesión, sin pisar un Authorization explícito. */
function headersConAuth(headers: Record<string, string> = {}): Record<string, string> {
  const token = leerToken();
  return token && !headers.Authorization ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function request<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const headers = headersConAuth({
    "Content-Type": "application/json",
    ...(opciones?.headers as Record<string, string> | undefined),
  });
  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  return handleResponse<T>(res);
}

export const api = {
  get: <T>(ruta: string) => request<T>(ruta),
  post: <T>(ruta: string, cuerpo: unknown) =>
    request<T>(ruta, { method: "POST", body: JSON.stringify(cuerpo) }),
  put: <T>(ruta: string, cuerpo: unknown) =>
    request<T>(ruta, { method: "PUT", body: JSON.stringify(cuerpo) }),
  // Multipart: NO fija Content-Type (el navegador pone el boundary del FormData)
  postForm: <T>(ruta: string, form: FormData) =>
    fetch(`${API_URL}${ruta}`, { method: "POST", body: form, headers: headersConAuth() }).then(
      (res) => handleResponse<T>(res),
    ),
};