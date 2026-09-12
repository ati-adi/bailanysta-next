import { getDb } from "../db";
import { newId, nowIso } from "../ids";
import type { Comment, FeedMode, Paginated, Post, UserSummary } from "../types";
import { toUserSummary, ValidationError, type UserRow } from "./users";
import { createNotification } from "./notifications";

export const POST_MAX_LENGTH = 500;
export const COMMENT_MAX_LENGTH = 300;

interface PostRow extends UserRow {
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: number;
}

function toPost(r: PostRow): Post {
  return {
    id: String(r.post_id),
    content: String(r.content),
    createdAt: String(r.created_at),
    updatedAt: r.updated_at ? String(r.updated_at) : null,
    author: toUserSummary(r),
    likeCount: Number(r.like_count),
    commentCount: Number(r.comment_count),
    likedByMe: Number(r.liked_by_me) > 0,
  };
}

/** Общий SELECT для постов: автор + счётчики + лайкнул ли viewer. */
const POST_SELECT = `
  SELECT p.id AS post_id, p.content, p.created_at, p.updated_at,
    u.id, u.username, u.display_name, u.avatar_color,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked_by_me
  FROM posts p JOIN users u ON u.id = p.author_id`;

export interface ListPostsOptions {
  viewerId: string | null;
  cursor: string | null;
  limit?: number;
  /** Фильтр по автору (username) */
  author?: string;
  /** Поиск по ключевому слову или хэштегу (#tag) */
  query?: string;
  mode?: FeedMode;
}

export async function listPosts(opts: ListPostsOptions): Promise<Paginated<Post>> {
  const db = await getDb();
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
  const viewer = opts.viewerId ?? "";
  const where: string[] = [];
  const args: (string | number)[] = [viewer];

  if (opts.cursor) {
    where.push("p.created_at < ?");
    args.push(opts.cursor);
  }
  if (opts.author) {
    where.push("u.username = ?");
    args.push(opts.author);
  }
  if (opts.query?.trim()) {
    // И хэштег (#tag), и обычное слово ищем как подстроку без учёта регистра.
    const term = opts.query.trim();
    where.push("LOWER(p.content) LIKE ?");
    args.push(`%${term.toLowerCase().replace(/[%_]/g, "")}%`);
  }
  if (opts.mode === "following") {
    if (!opts.viewerId) return { items: [], nextCursor: null };
    where.push("(p.author_id = ? OR p.author_id IN (SELECT following_id FROM follows WHERE follower_id = ?))");
    args.push(opts.viewerId, opts.viewerId);
  }

  const sql = `${POST_SELECT}${where.length ? ` WHERE ${where.join(" AND ")}` : ""}
    ORDER BY p.created_at DESC LIMIT ?`;
  args.push(limit + 1);

  const { rows } = await db.execute({ sql, args });
  const items = rows.slice(0, limit).map((r) => toPost(r as unknown as PostRow));
  return {
    items,
    nextCursor: rows.length > limit ? items[items.length - 1].createdAt : null,
  };
}

export async function getPost(id: string, viewerId: string | null): Promise<Post | null> {
  const db = await getDb();
  const { rows } = await db.execute({ sql: `${POST_SELECT} WHERE p.id = ?`, args: [viewerId ?? "", id] });
  return rows[0] ? toPost(rows[0] as unknown as PostRow) : null;
}

function validateContent(content: unknown, max: number): string {
  if (typeof content !== "string") throw new ValidationError("Текст обязателен");
  const trimmed = content.trim();
  if (!trimmed) throw new ValidationError("Текст не может быть пустым");
  if (trimmed.length > max) throw new ValidationError(`Максимум ${max} символов`);
  return trimmed;
}

export async function createPost(authorId: string, content: unknown): Promise<Post> {
  const text = validateContent(content, POST_MAX_LENGTH);
  const db = await getDb();
  const id = newId();
  await db.execute({
    sql: "INSERT INTO posts (id, author_id, content, created_at) VALUES (?, ?, ?, ?)",
    args: [id, authorId, text, nowIso()],
  });
  return (await getPost(id, authorId))!;
}

export async function updatePost(postId: string, userId: string, content: unknown): Promise<Post> {
  const text = validateContent(content, POST_MAX_LENGTH);
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE posts SET content = ?, updated_at = ? WHERE id = ? AND author_id = ?",
    args: [text, nowIso(), postId, userId],
  });
  if (res.rowsAffected === 0) throw new ValidationError("Пост не найден или это не ваш пост");
  return (await getPost(postId, userId))!;
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const db = await getDb();
  const res = await db.execute({
    sql: "DELETE FROM posts WHERE id = ? AND author_id = ?",
    args: [postId, userId],
  });
  if (res.rowsAffected === 0) throw new ValidationError("Пост не найден или это не ваш пост");
}

export async function setLike(postId: string, userId: string, liked: boolean): Promise<{ likeCount: number; likedByMe: boolean }> {
  const db = await getDb();
  const post = await db.execute({ sql: "SELECT author_id FROM posts WHERE id = ?", args: [postId] });
  if (!post.rows[0]) throw new ValidationError("Пост не найден");
  if (liked) {
    const res = await db.execute({
      sql: "INSERT OR IGNORE INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)",
      args: [userId, postId, nowIso()],
    });
    if (res.rowsAffected > 0) {
      await createNotification({ userId: String(post.rows[0].author_id), actorId: userId, type: "like", postId });
    }
  } else {
    await db.execute({ sql: "DELETE FROM likes WHERE user_id = ? AND post_id = ?", args: [userId, postId] });
  }
  const { rows } = await db.execute({ sql: "SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", args: [postId] });
  return { likeCount: Number(rows[0].c), likedByMe: liked };
}

export async function listComments(postId: string): Promise<Comment[]> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT c.id, c.post_id, c.content, c.created_at, u.id AS uid, u.username, u.display_name, u.avatar_color
          FROM comments c JOIN users u ON u.id = c.author_id WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    args: [postId],
  });
  return rows.map((r) => ({
    id: String(r.id),
    postId: String(r.post_id),
    content: String(r.content),
    createdAt: String(r.created_at),
    author: toUserSummary({
      id: String(r.uid),
      username: String(r.username),
      display_name: String(r.display_name),
      avatar_color: String(r.avatar_color),
    }),
  }));
}

export async function addComment(postId: string, author: UserSummary, content: unknown): Promise<Comment> {
  const text = validateContent(content, COMMENT_MAX_LENGTH);
  const db = await getDb();
  const post = await db.execute({ sql: "SELECT author_id FROM posts WHERE id = ?", args: [postId] });
  if (!post.rows[0]) throw new ValidationError("Пост не найден");
  const id = newId();
  const createdAt = nowIso();
  await db.execute({
    sql: "INSERT INTO comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [id, postId, author.id, text, createdAt],
  });
  await createNotification({ userId: String(post.rows[0].author_id), actorId: author.id, type: "comment", postId });
  return { id, postId, content: text, createdAt, author };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const db = await getDb();
  const res = await db.execute({
    sql: "DELETE FROM comments WHERE id = ? AND author_id = ?",
    args: [commentId, userId],
  });
  if (res.rowsAffected === 0) throw new ValidationError("Комментарий не найден или это не ваш комментарий");
}

/** Популярные хэштеги по последним постам — для блока «Тренды» и подсказок поиска. */
export async function trendingHashtags(limit = 8): Promise<Array<{ tag: string; count: number }>> {
  const db = await getDb();
  const { rows } = await db.execute("SELECT content FROM posts ORDER BY created_at DESC LIMIT 200");
  const counts = new Map<string, number>();
  for (const r of rows) {
    const tags = String(r.content).match(/#[\p{L}\p{N}_]+/gu) ?? [];
    for (const t of new Set(tags.map((x) => x.toLowerCase()))) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
