"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostList } from "@/components/post/PostList";
import { usePosts } from "@/components/post/usePosts";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api-client";
import type { UserSummary } from "@/lib/types";

export function SearchResults({ query }: { query: string }) {
  const q = query.trim();
  const feed = usePosts({ q: q || undefined });
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [trending, setTrending] = useState<Array<{ tag: string; count: number }>>([]);

  useEffect(() => {
    api
      .get<{ users: UserSummary[]; trending: Array<{ tag: string; count: number }> }>(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => { setUsers(r.users); setTrending(r.trending); })
      .catch(() => {});
  }, [q]);

  if (!q) {
    return (
      <EmptyState
        title="Введите запрос"
        description="Ищите по словам или хэштегам, например #frontend"
        action={
          trending.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {trending.map((t) => (
                <Link key={t.tag} href={`/search?q=${encodeURIComponent(t.tag)}`} className="rounded-full border border-border px-3 py-1 text-sm text-accent hover:bg-surface-2">{t.tag}</Link>
              ))}
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">
        Результаты по запросу <span className="text-accent">{q}</span>
      </h1>
      {users.length > 0 && (
        <section aria-label="Пользователи" className="rounded-2xl border border-border bg-surface p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Люди</h2>
          <ul className="flex flex-wrap gap-2">
            {users.map((u) => (
              <li key={u.id}>
                <Link href={`/profile/${u.username}`} className="flex items-center gap-2 rounded-full border border-border px-2 py-1 pr-3 text-sm hover:bg-surface-2">
                  <Avatar user={u} size="sm" /> <span className="font-medium">{u.displayName}</span> <span className="text-muted">@{u.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <PostList {...feed} onLoadMore={feed.loadMore} onChange={feed.replace} onDelete={feed.remove} emptyTitle="Ничего не найдено" emptyDescription="Попробуйте другое слово или хэштег." />
    </div>
  );
}
