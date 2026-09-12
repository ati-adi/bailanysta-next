"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label } from "@/components/ui/Field";
import { api } from "@/lib/api-client";
import type { UserSummary } from "@/lib/types";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === "login";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post<{ user: UserSummary }>(
        isLogin ? "/api/auth/login" : "/api/auth/register",
        isLogin ? { username, password } : { username, displayName, password },
      );
      await refresh();
      router.push(params.get("next") ?? `/profile/${user.username}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">{isLogin ? "Вход" : "Регистрация"}</h1>
      <p className="mt-1 text-sm text-muted">
        {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
        <Link href={isLogin ? "/register" : "/login"} className="text-accent hover:underline">
          {isLogin ? "Зарегистрироваться" : "Войти"}
        </Link>
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="username">Логин</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus placeholder="например, aisha" />
        </div>
        {!isLogin && (
          <div>
            <Label htmlFor="displayName">Имя</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" required maxLength={50} placeholder="Как вас называть" />
          </div>
        )}
        <div>
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} required minLength={6} />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" loading={busy}>
          {isLogin ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>
      {isLogin && (
        <p className="mt-6 rounded-xl bg-surface-2 p-3 text-xs text-muted">
          Демо-аккаунты: <code className="font-mono">aisha</code>, <code className="font-mono">daniyar</code>,{" "}
          <code className="font-mono">madina</code>, <code className="font-mono">arman</code> — пароль <code className="font-mono">password</code>.
        </p>
      )}
    </div>
  );
}
