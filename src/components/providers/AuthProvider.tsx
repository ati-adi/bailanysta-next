"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserSummary } from "@/lib/types";
import { api } from "@/lib/api-client";

interface AuthContextValue {
  user: UserSummary | null;
  unread: number;
  setUnread: (n: number) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Текущий пользователь приходит с сервера (layout читает cookie) и передаётся
 * в клиентский контекст, чтобы шапка и композер знали, кто залогинен, без лишнего запроса.
 */
export function AuthProvider({
  initialUser,
  initialUnread,
  children,
}: {
  initialUser: UserSummary | null;
  initialUnread: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [unread, setUnread] = useState(initialUnread);

  const refresh = useCallback(async () => {
    const data = await api.get<{ user: UserSummary | null; unreadNotifications: number }>("/api/auth/me");
    setUser(data.user);
    setUnread(data.unreadNotifications);
    router.refresh();
  }, [router]);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    setUnread(0);
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, unread, setUnread, refresh, logout }), [user, unread, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
