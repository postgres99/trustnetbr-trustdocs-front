const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
let apiCulture = navigator.language || "pt-BR";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  code: string;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  public constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function setApiCulture(culture: string) {
  apiCulture = culture || "pt-BR";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Accept-Language", apiCulture);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? "Nao foi possivel concluir a solicitacao.",
      response.status,
      payload?.code
    );
  }

  return payload.data;
}

export async function apiDownload(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": apiCulture
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiError(
      payload?.message ?? "Nao foi possivel baixar o documento.",
      response.status,
      payload?.code
    );
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const simpleName = disposition.match(/filename="?([^";]+)"?/i)?.[1];

  return {
    blob: await response.blob(),
    fileName: encodedName
      ? decodeURIComponent(encodedName)
      : simpleName || "documento"
  };
}

export async function apiBlob(
  path: string,
  token: string
): Promise<Blob | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": apiCulture
    }
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiError(
      payload?.message ?? "Nao foi possivel carregar o arquivo.",
      response.status,
      payload?.code
    );
  }

  return response.blob();
}
