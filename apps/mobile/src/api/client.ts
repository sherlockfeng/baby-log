import { API_BASE_URL } from "../config";

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<Response> {
  const { method = "GET", token, body } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function apiJson<T>(path: string, options?: { method?: string; token?: string | null; body?: unknown }): Promise<T> {
  const res = await apiRequest(path, options);
  const data = (await res.json()) as T;
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data;
}
