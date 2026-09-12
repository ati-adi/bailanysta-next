"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import type { Notification, Paginated } from "@/lib/types";

const LABELS: Record<Notification["type"], string> = {
  like: "поставил(а) лайк вашему посту",
  comment: "прокомментировал(а) ваш пост",
  follow: "подписался(ась) на вас",
};

export function NotificationList() {
  const { setUnread } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Paginated<Notification>>("/api/notifications")
      .then(async (page) => {
        setItems(page.items);
        setCursor(page.nextCursor);
        // Открыли страницу — считаем всё прочитанным.
        if (page.items.some((n) => !n.read)) {
          await api.post("/api/notifications/read");
          setUnread(0);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [setUnread]);

  async function loadMore() {
    if (!cursor) return;
    setBusy(true);
    const page = await api.get<Paginated<Notification>>(`/api/notifications?cursor=${encodeURIComponent(cursor)}`);
    setItems((prev) => [...(prev ?? []), ...page.items]);
    setCursor(page.nextCursor);
    setBusy(false);
  }

  if (error) return <EmptyState title="Ошибка" description={error} />;
  if (items === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-3 w-56" /><Skeleton className="h-3 w-24" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) return <EmptyState title="Уведомлений пока нет" description="Здесь появятся лайки, комментарии и новые подписчики." />;

  return (
    <div className="space-y-2">
      {items.map((n) => {
        const href = n.postId ? `/post/${n.postId}` : `/profile/${n.actor.username}`;
        return (
          <Link
            key={n.id}
            href={href}
            className={`fade-in flex items-start gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-surface-2 ${n.read ? "bg-surface" : "bg-accent-soft/40"}`}
          >
            <Avatar user={n.actor} size="sm" />
            <div className="min-w-0 flex-1 text-sm">
              <p>
                <span className="font-semibold">{n.actor.displayName}</span> {LABELS[n.type]}
              </p>
              {n.postPreview && <p className="mt-0.5 truncate text-muted">«{n.postPreview}»</p>}
              <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Непрочитано" />}
          </Link>
        );
      })}
      {cursor && (
        <div className="flex justify-center py-2">
          <Button variant="secondary" onClick={loadMore} loading={busy}>Показать ещё</Button>
        </div>
      )}
    </div>
  );
}
