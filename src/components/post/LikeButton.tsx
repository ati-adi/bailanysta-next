"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api-client";
import type { Post } from "@/lib/types";

/** Лайк с оптимистичным обновлением и откатом при ошибке. */
export function LikeButton({ post, onChange }: { post: Post; onChange?: (post: Post) => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (busy) return;
    const next = !post.likedByMe;
    onChange?.({ ...post, likedByMe: next, likeCount: post.likeCount + (next ? 1 : -1) });
    setBusy(true);
    try {
      const res = next
        ? await api.post<{ likeCount: number; likedByMe: boolean }>(`/api/posts/${post.id}/like`)
        : await api.delete<{ likeCount: number; likedByMe: boolean }>(`/api/posts/${post.id}/like`);
      onChange?.({ ...post, ...res });
    } catch {
      onChange?.(post);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={post.likedByMe}
      aria-label={post.likedByMe ? "Убрать лайк" : "Поставить лайк"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface-2 ${
        post.likedByMe ? "text-like" : "hover:text-like"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {post.likeCount}
    </button>
  );
}
