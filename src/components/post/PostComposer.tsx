"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AiAssist } from "@/components/ai/AiAssist";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorText, Textarea } from "@/components/ui/Field";
import { api } from "@/lib/api-client";
import type { Post } from "@/lib/types";

const MAX = 500;

export function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:underline">Войдите</Link> или{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">зарегистрируйтесь</Link>, чтобы публиковать посты.
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const post = await api.post<Post>("/api/posts", { content });
      setContent("");
      onCreated(post);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1 space-y-2">
          <Textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Что нового? Используйте #хэштеги"
            maxLength={MAX}
            aria-label="Текст поста"
          />
          <AiAssist onResult={setContent} />
          <ErrorText>{error}</ErrorText>
          <div className="flex items-center justify-end gap-3">
            <span className={`text-xs ${content.length > MAX - 50 ? "text-danger" : "text-muted"}`}>
              {content.length}/{MAX}
            </span>
            <Button type="submit" loading={busy} disabled={!content.trim()}>
              Опубликовать
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
