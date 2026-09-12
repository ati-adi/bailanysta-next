import { getDb } from "../db";
import { newId, nowIso } from "../ids";
import type { Notification, NotificationType, Paginated } from "../types";
import { toUserSummary, type UserRow } from "./users";

export async function createNotification(input: {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId: string | null;
}): Promise<void> {
  // Не уведомляем пользователя о его собственных действиях.
  if (input.userId === input.actorId) return;
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO notifications (id, user_id, actor_id, type, post_id, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
    args: [newId(), input.userId, input.actorId, input.type, input.postId, nowIso()],
  });
}

export async function listNotifications(userId: string, cursor: string | null, limit = 20): Promise<Paginated<Notification>> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT n.id, n.type, n.post_id, n.read, n.created_at,
            u.id AS actor_id, u.username, u.display_name, u.avatar_color,
            substr(p.content, 1, 80) AS post_preview
          FROM notifications n
          JOIN users u ON u.id = n.actor_id
          LEFT JOIN posts p ON p.id = n.post_id
          WHERE n.user_id = ? AND (? IS NULL OR n.created_at < ?)
          ORDER BY n.created_at DESC
          LIMIT ?`,
    args: [userId, cursor, cursor, limit + 1],
  });
  const items = rows.slice(0, limit).map<Notification>((r) => ({
    id: String(r.id),
    type: String(r.type) as NotificationType,
    actor: toUserSummary({
      id: String(r.actor_id),
      username: String(r.username),
      display_name: String(r.display_name),
      avatar_color: String(r.avatar_color),
    } as UserRow),
    postId: r.post_id ? String(r.post_id) : null,
    postPreview: r.post_preview ? String(r.post_preview) : null,
    read: Number(r.read) === 1,
    createdAt: String(r.created_at),
  }));
  return {
    items,
    nextCursor: rows.length > limit ? items[items.length - 1].createdAt : null,
  };
}

export async function countUnread(userId: string): Promise<number> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0",
    args: [userId],
  });
  return Number(rows[0].c);
}

export async function markAllRead(userId: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0", args: [userId] });
}
