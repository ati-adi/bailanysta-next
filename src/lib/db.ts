import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

/**
 * Единая точка доступа к базе данных.
 *
 * - Локально: SQLite-файл `data/bailanysta.db` (ничего настраивать не нужно).
 * - Продакшен: Turso (libSQL по HTTP) через TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 * - Vercel без Turso: in-memory база с сид-данными (демо-режим, без персистентности).
 *
 * Клиент кэшируется в globalThis, чтобы hot-reload в dev не плодил соединения.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, post_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (follower_id, following_id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`,
];

function resolveUrl(): { url: string; authToken?: string } {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL };
  }
  // Serverless-платформы имеют read-only файловую систему — используем память.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return { url: ":memory:" };
  }
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return { url: `file:${path.join(dir, "bailanysta.db")}` };
}

const globalForDb = globalThis as unknown as {
  __bailanystaDb?: Promise<Client>;
};

async function init(): Promise<Client> {
  const client = createClient(resolveUrl());
  await client.batch(SCHEMA, "write");
  await seedIfEmpty(client);
  return client;
}

export function getDb(): Promise<Client> {
  if (!globalForDb.__bailanystaDb) {
    globalForDb.__bailanystaDb = init().catch((err) => {
      globalForDb.__bailanystaDb = undefined;
      throw err;
    });
  }
  return globalForDb.__bailanystaDb;
}

export function isPersistent(): boolean {
  return resolveUrl().url !== ":memory:";
}
