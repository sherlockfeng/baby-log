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

export async function apiUpload(
  path: string,
  files: { uri: string; name: string; type: string }[],
  token?: string | null,
): Promise<{ files: { key: string; url: string }[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error || `Upload failed ${res.status}`);
  }
  return res.json();
}

export async function apiJson<T>(path: string, options?: { method?: string; token?: string | null; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await apiRequest(path, options);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
      throw new Error("无法连接服务器，请确认 API 已启动（如 cd services/api && rushx dev）且 EXPO_PUBLIC_API_URL 正确");
    }
    throw e;
  }

  let data: T | { error?: string };
  try {
    const text = await res.text();
    data = text ? (JSON.parse(text) as T | { error?: string }) : ({} as T);
  } catch {
    if (!res.ok) {
      throw new Error(`请求失败 ${res.status} ${res.statusText || ""}`.trim());
    }
    throw new Error("接口返回格式异常");
  }

  if (!res.ok) {
    const errMsg = (data as { error?: string }).error || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return data as T;
}
