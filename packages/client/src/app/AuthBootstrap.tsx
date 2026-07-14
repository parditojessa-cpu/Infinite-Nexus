import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export function AuthBootstrap() {
  // zustand's `persist` rehydrates synchronously from localStorage before
  // first render, so a returning user's session is already available here.
  const hasPersistedUser = !!useAuthStore.getState().user;
  const [ready, setReady] = useState(hasPersistedUser);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    async function bootstrap() {
      let refreshRes: Response;
      try {
        refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      } catch {
        // Network unreachable. If we already restored a cached session above,
        // leave it in place so previously-visited pages keep working offline —
        // only a first-ever visit with no cached session lands on /login.
        setReady(true);
        return;
      }

      if (refreshRes.ok) {
        try {
          const { accessToken } = await refreshRes.json();
          useAuthStore.getState().setAccessToken(accessToken);
          const { user } = await apiFetch<{ user: any }>("/auth/me");
          setSession(user, accessToken);
        } catch {
          // /auth/me failed after a successful refresh (e.g. connection
          // dropped mid-flight) — keep whatever cached session we had.
        }
      } else if (refreshRes.status === 401) {
        // The API was reachable and explicitly rejected the refresh token —
        // this is a genuine logout, not a connectivity issue.
        useAuthStore.getState().clear();
      }
      // Any other non-ok status (502/503/504 from a proxy or load balancer
      // when the API itself is down, unexpected 5xx, etc.) is an
      // infrastructure problem, not proof the session is invalid — leave the
      // cached session alone rather than logging the user out for it.
      setReady(true);
    }
    bootstrap();
  }, [setSession]);

  if (!ready) {
    return <div className="h-full flex items-center justify-center text-text-secondary text-sm">Loading…</div>;
  }

  return <Outlet />;
}
