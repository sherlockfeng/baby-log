/**
 * Hash token for storage/lookup. v0.1 uses SHA-256 (no pepper).
 */
export async function hashToken(token: string): Promise<string> {
  const buf = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Extract Bearer token from Authorization header. Returns null if missing/invalid.
 */
export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
  return token || null;
}
