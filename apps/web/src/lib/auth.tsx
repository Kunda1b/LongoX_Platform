"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type User = {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
  emailVerifiedAt: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    organizationName?: string,
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function getStoredAuth(): { token: string; user: User } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredAuth(token: string, user: User) {
  localStorage.setItem("auth", JSON.stringify({ token, user }));
}

function clearStoredAuth() {
  localStorage.removeItem("auth");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setToken(stored.token);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Login failed" }));
        throw new Error(err.error);
      }
      const data = (await res.json()) as { token: string; user: User };
      setToken(data.token);
      setUser(data.user);
      setStoredAuth(data.token, data.user);
      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      organizationName?: string,
    ) => {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Registration failed" }));
        throw new Error(err.error ?? "Registration failed");
      }
      const data = (await res.json()) as { token: string; user: User };
      setToken(data.token);
      setUser(data.user);
      setStoredAuth(data.token, data.user);
      router.push("/verify-email");
    },
    [router],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
    fetch(`${API}/auth/logout`, { method: "POST" }).catch(() => {});
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
