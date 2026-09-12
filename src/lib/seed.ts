import type { Client } from "@libsql/client";
import bcrypt from "bcryptjs";
import { newId } from "./ids";

/**
 * Заполняет пустую базу демонстрационными пользователями и постами,
 * чтобы лента не была пустой при первом запуске. Пароль у всех демо-аккаунтов: `password`.
 */
export async function seedIfEmpty(db: Client): Promise<void> {
  const { rows } = await db.execute("SELECT COUNT(*) AS c FROM users");
  if (Number(rows[0].c) > 0) return;

  const passwordHash = await bcrypt.hash("password", 10);
  const users = [
    { username: "aisha", name: "Айша Нурланова", bio: "Frontend-разработчица из Алматы. Люблю React и горы.", color: "#e11d48" },
    { username: "daniyar", name: "Данияр Серик", bio: "Backend, базы данных и кофе. Пишу о системном дизайне.", color: "#2563eb" },
    { username: "madina", name: "Мадина Ахметова", bio: "Продуктовый дизайнер. Делюсь мыслями про UX и типографику.", color: "#059669" },
    { username: "arman", name: "Арман Бекжанов", bio: "Студент, учу ML и иногда бегаю марафоны.", color: "#d97706" },
  ];

  const ids: Record<string, string> = {};
  const base = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const at = (offsetMinutes: number) => new Date(base + offsetMinutes * 60_000).toISOString();

  for (const [i, u] of users.entries()) {
    const id = newId() + i;
    ids[u.username] = id;
    await db.execute({
      sql: "INSERT INTO users (id, username, display_name, bio, avatar_color, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, u.username, u.name, u.bio, u.color, passwordHash, at(0)],
    });
  }

  const posts: Array<[string, string, number]> = [
    ["aisha", "Привет, Bailanysta! Это моя первая запись здесь. Планирую делиться заметками про #frontend и #react.", 10],
    ["daniyar", "Небольшая мысль: индекс по (author_id, created_at) покрывает 90% запросов к ленте профиля. Не забывайте про составные индексы. #database #sqlite", 45],
    ["madina", "Тёмная тема — это не просто инверсия цветов. Контраст текста должен падать, а не расти. #ux #design", 120],
    ["arman", "Пробежал сегодня 15 км, а потом два часа читал про трансформеры. Хороший день. #ml #running", 300],
    ["aisha", "Skeleton-лоадеры воспринимаются быстрее спиннеров, даже если реальное время загрузки одинаковое. Проверено на пользователях. #ux #frontend", 700],
    ["daniyar", "Курсорная пагинация > offset-пагинация. Особенно когда лента обновляется в реальном времени. #backend", 1500],
    ["madina", "Собрала мудборд для нового проекта. Вдохновляюсь казахским орнаментом и швейцарской типографикой. #design", 2600],
    ["arman", "Кто-нибудь пробовал libSQL/Turso? Интересует, насколько стабильно работает с serverless. #database", 4000],
  ];

  const postIds: string[] = [];
  for (const [i, [author, content, minutes]] of posts.entries()) {
    const id = newId() + i;
    postIds.push(id);
    await db.execute({
      sql: "INSERT INTO posts (id, author_id, content, created_at) VALUES (?, ?, ?, ?)",
      args: [id, ids[author], content, at(minutes)],
    });
  }

  const follows: Array<[string, string]> = [
    ["aisha", "daniyar"], ["aisha", "madina"], ["daniyar", "aisha"],
    ["madina", "aisha"], ["arman", "daniyar"], ["arman", "aisha"],
  ];
  for (const [a, b] of follows) {
    await db.execute({
      sql: "INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)",
      args: [ids[a], ids[b], at(5)],
    });
  }

  const likes: Array<[string, number]> = [
    ["daniyar", 0], ["madina", 0], ["arman", 0], ["aisha", 1], ["arman", 1],
    ["aisha", 2], ["daniyar", 2], ["madina", 4], ["daniyar", 4], ["aisha", 7],
  ];
  for (const [u, p] of likes) {
    await db.execute({
      sql: "INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)",
      args: [ids[u], postIds[p], at(50)],
    });
  }

  const comments: Array<[string, number, string]> = [
    ["daniyar", 0, "Добро пожаловать! Ждём заметок про React."],
    ["madina", 0, "Ура, наконец-то ты здесь 🎉"],
    ["aisha", 2, "Полностью согласна. Чистый #fff на чёрном — боль для глаз."],
    ["aisha", 7, "Пробовала, для небольших проектов очень удобно: один и тот же код работает с локальным файлом и с облаком."],
  ];
  for (const [i, [u, p, text]] of comments.entries()) {
    await db.execute({
      sql: "INSERT INTO comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [newId() + "c" + i, postIds[p], ids[u], text, at(60 + i)],
    });
  }
}
