const FACEID_ENABLED_KEY = "babylog_faceid_enabled";
const LOCK_LAST_UNLOCK_KEY = "babylog_lock_last_unlock";
const GRACE_MS = 60 * 1000;

export async function getFaceIdEnabled(): Promise<boolean> {
  return localStorage.getItem(FACEID_ENABLED_KEY) === "1";
}

export async function setFaceIdEnabled(enabled: boolean): Promise<void> {
  localStorage.setItem(FACEID_ENABLED_KEY, enabled ? "1" : "0");
}

export async function setLastUnlockTime(): Promise<void> {
  localStorage.setItem(LOCK_LAST_UNLOCK_KEY, Date.now().toString());
}

export async function isWithinGracePeriod(): Promise<boolean> {
  const v = localStorage.getItem(LOCK_LAST_UNLOCK_KEY);
  if (!v) return false;
  const t = parseInt(v, 10);
  return Date.now() - t < GRACE_MS;
}
