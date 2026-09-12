"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";
import { PostContent } from "./PostContent";
import { LikeButton } from "./LikeButton";

interface Props {
  post: Post;
  onChange?: (post: Post) => void;
  onDelete?: (id: string) => void;
  /** На странице поста заголовок не должен вести сам на себя */
  standalone?: boolean;
}

export function PostCard({ post, onChange, onDelete, standalone = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mine = user?.id === post.author.id;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.patch<Post>(`/api/posts/${post.id}`, { content: draft });
      onChange?.(updated);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Удалить пост?")) return;
    setBusy(true);
    try {
      await api.delete(`/api/posts/${post.id}`);
      onDelete?.(post.id);
      if (standalone) router.push("/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <article className="fade-in rounded-2xl border border-border bg-surface p-4">
      <header className="flex items-center gap-3">
        <Link href={`/profile/${post.author.username}`} aria-label={post.author.displayName}>
          <Avatar user={post.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.username}`} className="block truncate font-semibold hover:underline">
            {post.author.displayName}
          </Link>
          <div className="truncate text-xs text-muted">
            @{post.author.username} · <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            {post.updatedAt && " · изменено"}
          </div>
        </div>
        {mine && !editing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setDraft(post.content); setEditing(true); }} aria-label="Редактировать">
              Изменить
            </Button>
            <Button variant="danger" size="sm" onClick={remove} loading={busy} aria-label="Удалить">
              Удалить
            </Button>
          </div>
        )}
      </header>

      <div className="mt-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} autoFocus />
            <div className="flex items-center justify-end gap-2">
              <span className="mr-auto text-xs text-muted">{draft.length}/500</span>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={busy}>
                Отмена
              </Button>
              <Button size="sm" onClick={save} loading={busy} disabled={!draft.trim()}>
                Сохранить
              </Button>
            </div>
          </div>
        ) : (
          <PostContent text={post.content} />
        )}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <footer className="mt-3 flex items-center gap-2 text-sm text-muted">
        <LikeButton post={post} onChange={onChange} />
        {standalone ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1">
            <CommentIcon /> {post.commentCount}
          </span>
        ) : (
          <Link
            href={`/post/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface-2 hover:text-text"
            aria-label="Комментарии"
          >
            <CommentIcon /> {post.commentCount}
          </Link>
        )}
      </footer>
    </article>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
