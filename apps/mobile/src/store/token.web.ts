const TOKEN_KEY = "babylog_family_token";

export async function getStoredToken(): Promise<string | null> {
  return localStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
}
