export const API_BASE = (import.meta as any).env.VITE_API_BASE || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, headers = {} } = options;
  const resolvedToken = token ?? localStorage.getItem("auth_token") ?? undefined;

  const requestHeaders: Record<string, string> = { ...headers };
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (resolvedToken) {
    requestHeaders.Authorization = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  let payload: any = null;

  try {
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload ? payload.error : null) ||
      (typeof payload === "string" && payload.trim().length ? payload : null) ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export function apiGet<T = unknown>(path: string, token?: string | null) {
  return apiRequest<T>(path, { method: "GET", token });
}

export function apiPost<T = unknown>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "POST", body, token });
}

export function apiPut<T = unknown>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "PUT", body, token });
}

export function apiDelete(path: string, token?: string | null, body?: unknown) {
  return apiRequest<void>(path, { method: "DELETE", token, body });
}

