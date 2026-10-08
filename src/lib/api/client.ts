// Fetch wrapper for the AI Marriage backend: bearer auth, envelope unwrapping,
// and single-use refresh-token rotation with a shared in-flight refresh.

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://kjgspl-aimarriage-backend-nodejs.onrender.com";

const ACCESS_KEY = "am.accessToken";
const REFRESH_KEY = "am.refreshToken";

export const tokenStore = {
  getAccess: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        tokenStore.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => (refreshPromise = null), 0);
      }
    })();
  }
  return refreshPromise;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = any>(
  path: string,
  options: { method?: Method; body?: unknown; auth?: boolean } = {},
  retried = false,
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? tokenStore.getAccess() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 401 && auth && !retried) {
    if (await refreshTokens()) return api<T>(path, options, true);
    tokenStore.clear();
    onSessionExpired?.();
  }

  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok || (json && json.success === false)) {
    const err = json?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "ERROR",
      err?.message ?? json?.message ?? "Something went wrong. Please try again.",
    );
  }
  // Some endpoints wrap payloads as { success, data }.
  if (json && typeof json === "object" && "data" in json && json.success === true) return json.data as T;
  return json as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function photoUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("assets/") || path.startsWith("/assets/")) {
    return `/${path.replace(/^\/+/, "")}`;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getProfilePhotoUrl(profile?: {
  mainPhotoUrl?: string | null;
  photoUrl?: string | null;
  image?: string | null;
  photos?: Array<{ id?: string; url?: string } | string>;
} | null): string | null {
  if (!profile) return null;
  if (profile.mainPhotoUrl) return photoUrl(profile.mainPhotoUrl);
  if (profile.photoUrl) return photoUrl(profile.photoUrl);
  if (profile.image) return photoUrl(profile.image);
  if (Array.isArray(profile.photos) && profile.photos.length > 0) {
    const first = profile.photos[0];
    if (typeof first === "string") return photoUrl(first);
    if (first?.url) return photoUrl(first.url);
    if (first?.id && !first.id.startsWith("photo_e2e")) {
      return `${API_BASE_URL}/v1/media/photos/${first.id}`;
    }
  }
  return null;
}
