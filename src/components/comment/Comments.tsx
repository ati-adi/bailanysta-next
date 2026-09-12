"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorText, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import type { Comment } from "@/lib/types";

export function Comments({ postId, onCountChange }: { postId: string; onCountChange?: (delta: number) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ items: Comment[] }>(`/api/posts/${postId}/comments`).then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, [postId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = await api.post<Comment>(`/api/posts/${postId}/comments`, { content: text });
      setItems((prev) => [...(prev ?? []), c]);
      setText("");
      onCountChange?.(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить комментарий?")) return;
    await api.delete(`/api/comments/${id}`);
    setItems((prev) => (prev ?? []).filter((c) => c.id !== id));
    onCountChange?.(-1);
  }

  return (
    <section aria-label="Комментарии" className="space-y-4">
      <h2 className="text-sm font-semibold text-muted">Комментарии</h2>

      {user ? (
        <form onSubmit={submit} className="flex gap-3">
          <Avatar user={user} size="sm" />
          <div className="flex-1 space-y-2">
            <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать комментарий…" maxLength={300} aria-label="Текст комментария" />
            <ErrorText>{error}</ErrorText>
            <div className="flex justify-end">
              <Button size="sm" type="submit" loading={busy} disabled={!text.trim()}>Отправить</Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">Войдите</Link>, чтобы комментировать.
        </p>
      )}

      {items === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-4 w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Комментариев пока нет. Будьте первым!</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="fade-in flex gap-3">
              <Link href={`/profile/${c.author.username}`}><Avatar user={c.author} size="sm" /></Link>
              <div className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-2">
                <div className="flex items-baseline gap-2 text-xs">
                  <Link href={`/profile/${c.author.username}`} className="font-semibold text-text hover:underline">{c.author.displayName}</Link>
                  <span className="text-muted">@{c.author.username} · {timeAgo(c.createdAt)}</span>
                  {user?.id === c.author.id && (
                    <button type="button" onClick={() => remove(c.id)} className="ml-auto text-muted hover:text-danger">Удалить</button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
