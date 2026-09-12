import { getDb } from "../db";
import { newId, nowIso } from "../ids";
import { hashPassword, verifyPassword } from "../password";
import type { UserProfile, UserSummary } from "../types";
import { createNotification } from "./notifications";

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
}

export function toUserSummary(row: UserRow): UserSummary {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    avatarColor: String(row.avatar_color),
  };
}

const AVATAR_COLORS = ["#e11d48", "#2563eb", "#059669", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#4f46e5"];

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/i;

export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function registerUser(input: { username: string; displayName: string; password: string }): Promise<UserSummary> {
  const username = input.username.trim();
  const displayName = input.displayName.trim();
  if (!USERNAME_RE.test(username)) {
    throw new ValidationError("Логин: 3–20 символов, латиница, цифры и _");
  }
  if (displayName.length < 1 || displayName.length > 50) {
    throw new ValidationError("Имя: от 1 до 50 символов");
  }
  if (input.password.length < 6) {
    throw new ValidationError("Пароль: минимум 6 символов");
  }
  const db = await getDb();
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  if (existing.rows.length) throw new ValidationError("Этот логин уже занят");

  const id = newId();
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  await db.execute({
    sql: "INSERT INTO users (id, username, display_name, bio, avatar_color, password_hash, created_at) VALUES (?, ?, ?, '', ?, ?, ?)",
    args: [id, username, displayName, color, await hashPassword(input.password), nowIso()],
  });
  return { id, username, displayName, avatarColor: color };
}

export async function authenticate(username: string, password: string): Promise<UserSummary | null> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: "SELECT id, username, display_name, avatar_color, password_hash FROM users WHERE username = ?",
    args: [username.trim()],
  });
  const row = rows[0];
  if (!row) return null;
  const ok = await verifyPassword(password, String(row.password_hash));
  return ok ? toUserSummary(row as unknown as UserRow) : null;
}

export async function getProfile(username: string, viewerId: string | null): Promise<UserProfile | null> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_color, u.created_at,
            (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS post_count,
            (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS follower_count,
            (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count,
            (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id AND f.follower_id = ?) AS followed_by_me
          FROM users u WHERE u.username = ?`,
    args: [viewerId ?? "", username],
  });
  const row = rows[0];
  if (!row) return null;
  const id = String(row.id);
  const isMe = viewerId === id;
  return {
    ...toUserSummary(row as unknown as UserRow),
    bio: String(row.bio),
    createdAt: String(row.created_at),
    postCount: Number(row.post_count),
    followerCount: Number(row.follower_count),
    followingCount: Number(row.following_count),
    isFollowedByMe: viewerId && !isMe ? Number(row.followed_by_me) > 0 : null,
    isMe,
  };
}

export async function updateProfile(userId: string, input: { displayName?: string; bio?: string }): Promise<void> {
  const db = await getDb();
  const displayName = input.displayName?.trim();
  const bio = input.bio?.trim();
  if (displayName !== undefined && (displayName.length < 1 || displayName.length > 50)) {
    throw new ValidationError("Имя: от 1 до 50 символов");
  }
  if (bio !== undefined && bio.length > 200) {
    throw new ValidationError("Био: не более 200 символов");
  }
  await db.execute({
    sql: "UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio) WHERE id = ?",
    args: [displayName ?? null, bio ?? null, userId],
  });
}

export async function findUserIdByUsername(username: string): Promise<string | null> {
  const db = await getDb();
  const { rows } = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  return rows[0] ? String(rows[0].id) : null;
}

export async function setFollow(followerId: string, targetUsername: string, follow: boolean): Promise<{ followerCount: number }> {
  const targetId = await findUserIdByUsername(targetUsername);
  if (!targetId) throw new ValidationError("Пользователь не найден");
  if (targetId === followerId) throw new ValidationError("Нельзя подписаться на себя");
  const db = await getDb();
  if (follow) {
    const res = await db.execute({
      sql: "INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)",
      args: [followerId, targetId, nowIso()],
    });
    if (res.rowsAffected > 0) {
      await createNotification({ userId: targetId, actorId: followerId, type: "follow", postId: null });
    }
  } else {
    await db.execute({
      sql: "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      args: [followerId, targetId],
    });
  }
  const { rows } = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM follows WHERE following_id = ?",
    args: [targetId],
  });
  return { followerCount: Number(rows[0].c) };
}

export async function searchUsers(query: string, limit = 5): Promise<UserSummary[]> {
  const db = await getDb();
  const q = `%${query.trim().replace(/[%_]/g, "")}%`;
  const { rows } = await db.execute({
    sql: "SELECT id, username, display_name, avatar_color FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT ?",
    args: [q, q, limit],
  });
  return rows.map((r) => toUserSummary(r as unknown as UserRow));
}
