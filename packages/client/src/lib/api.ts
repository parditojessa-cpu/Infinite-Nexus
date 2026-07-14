import { useAuthStore } from "./authStore";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Thrown when fetch() itself fails to reach the network (offline, DNS
// failure, connection refused) — distinct from a server responding with an
// error status, so callers can show "you're offline" instead of a generic
// request-failed message.
export class NetworkError extends Error {
  constructor() {
    super("You're offline — this action needs an internet connection.");
  }
}

type RefreshOutcome = { token: string } | { rejected: true } | { unreachable: true };

let refreshPromise: Promise<RefreshOutcome> | null = null;

async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          useAuthStore.getState().setAccessToken(data.accessToken);
          return { token: data.accessToken as string };
        }
        // Only a real 401 means the refresh token itself is invalid/expired.
        // Any other status (502/503/504 from a downed API behind a proxy,
        // etc.) is an infrastructure hiccup, not proof the session is bad.
        return res.status === 401 ? { rejected: true as const } : { unreachable: true as const };
      })
      .catch(() => ({ unreachable: true as const }))
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const token = useAuthStore.getState().accessToken;
    try {
      return await fetch(`/api${path}`, {
        ...options,
        credentials: "include",
        headers: {
          ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch {
      // fetch() rejects (rather than resolving with a non-ok Response) when
      // the request never reached a server at all.
      throw new NetworkError();
    }
  };

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith("/auth")) {
    const outcome = await refreshAccessToken();
    if ("token" in outcome) {
      res = await doFetch();
    } else if ("rejected" in outcome) {
      useAuthStore.getState().clear();
    }
    // "unreachable": leave the session as-is and let the original 401
    // response fall through to the ApiError below — a transient failure to
    // refresh shouldn't log the user out.
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
