import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@finite-nexus/shared";
import { queryClient } from "./queryClient";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
}

// Only flush cached query data when the logged-in user actually changes (or on
// logout) — clearing on every call (e.g. StrictMode's double effect-invoke,
// or a same-user refresh) would abort in-flight queries for that same user
// and permanently strand them in a pending state.
//
// Persisted to localStorage so a full page reload with no network available
// (offline, or the API temporarily unreachable) can restore the last known
// session immediately instead of bouncing the user back to /login just
// because the background token-refresh call couldn't reach the server.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => {
        if (get().user && get().user!.id !== user.id) {
          queryClient.clear();
        }
        set({ user, accessToken });
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => {
        if (get().user) {
          queryClient.clear();
        }
        set({ user: null, accessToken: null });
      },
    }),
    { name: "finite-nexus-auth" }
  )
);
