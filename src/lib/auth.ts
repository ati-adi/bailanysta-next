import { cookies } from "next/headers";
import { getDb } from "./db";
import { newId } from "./ids";
import type { UserSummary } from "./types";
import { toUserSummary, type UserRow } from "./services/users";

export const SESSION_COOKIE = "bailanysta_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 дней

export class AuthError extends Error {
  constructor(message = "Требуется авторизация") {
    super(message);
    this.name = "AuthError";
  }
}

/** Создаёт сессию в БД и ставит HttpOnly cookie. */
export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const id = newId() + newId();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await db.execute({
    sql: "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    args: [id, userId, expires.toISOString()],
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    const db = await getDb();
    await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
  }
  store.delete(SESSION_COOKIE);
}

/** Текущий пользователь по cookie или null. Безопасно вызывать из Server Components и Route Handlers. */
export async function getCurrentUser(): Promise<UserSummary | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT u.id, u.username, u.display_name, u.avatar_color, s.expires_at
          FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    args: [id],
  });
  const row = rows[0];
  if (!row) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
    return null;
  }
  return toUserSummary(row as unknown as UserRow);
}

export async function requireUser(): Promise<UserSummary> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}
