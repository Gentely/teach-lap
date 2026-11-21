// Fetch helper with a hard timeout + safe JSON handling + friendly error messages.
// Used by client components so a slow/dead backend never leaves the UI hanging
// or shows a raw "TypeError: fetch failed".

export const API_FETCH_TIMEOUT_MS = 25000;

export async function apiFetch(url: string, options: RequestInit = {}, timeoutMs = API_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** True when the browser couldn't get a usable response (network failure, timeout, abort, etc.) */
export function isNetworkFailure(e: any): boolean {
  if (!e) return false;
  const msg = String(e.message || "");
  if (e.name === "AbortError") return true;
  return /fetch failed|network|load failed|abort|timeout|connection|failed to fetch/i.test(msg);
}

/**
 * Map any thrown error to a message safe to show in the UI.
 * Empty/unknown messages are treated as a connection failure so the user gets
 * a helpful message instead of a raw browser error.
 */
export function friendlyError(e: any, isRTL: boolean): string {
  const msg = String(e?.message || "").trim();
  if (!msg || isNetworkFailure(e)) {
    return isRTL
      ? "تعذّر الاتصال بالخادم — تحقّق من اتصالك بالإنترنت وأعد المحاولة لاحقاً"
      : "Could not reach the server — check your connection and try again later";
  }
  return msg;
}
