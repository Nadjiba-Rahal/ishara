"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "./api-client";
import type { AuthResponse } from "./api-client";

type Session = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ishara.session";

function fromAuthResponse(response: AuthResponse): Session {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.userId,
    email: response.email,
    displayName: response.displayName,
    role: response.role
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Session;
          setSession(parsed);
          const me = await getMe(parsed.accessToken);
          if (!me.userId) {
            setSession(null);
            window.localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (typeof window === "undefined") return;
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const response = await apiLogin({ email, password });
        persist(fromAuthResponse(response));
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not reach the ISHARA API.");
        return false;
      }
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      setError(null);
      try {
        const response = await apiRegister({ email, password, displayName });
        persist(fromAuthResponse(response));
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not reach the ISHARA API.");
        return false;
      }
    },
    [persist]
  );

  const logout = useCallback(async () => {
    if (session) {
      try {
        await apiLogout(session.refreshToken);
      } catch {
        // Best-effort revoke.
      }
    }
    persist(null);
  }, [session, persist]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ session, isLoading, error, login, register, logout, clearError }),
    [session, isLoading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
