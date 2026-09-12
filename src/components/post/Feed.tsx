"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { FeedMode } from "@/lib/types";
import { PostComposer } from "./PostComposer";
import { PostList } from "./PostList";
import { usePosts } from "./usePosts";

/** Главная лента: вкладки «Все» / «Подписки», композер и список с пагинацией. */
export function Feed() {
  const { user } = useAuth();
  const [mode, setMode] = useState<FeedMode>("all");
  const feed = usePosts({ mode });

  return (
    <div className="space-y-4">
      <PostComposer onCreated={feed.prepend} />
      {user && (
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1" role="tablist" aria-label="Режим ленты">
          {(["all", "following"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                mode === m ? "bg-accent text-white" : "text-muted hover:text-text"
              }`}
            >
              {m === "all" ? "Все" : "Подписки"}
            </button>
          ))}
        </div>
      )}
      <PostList
        {...feed}
        onLoadMore={feed.loadMore}
        onChange={feed.replace}
        onDelete={feed.remove}
        emptyTitle={mode === "following" ? "В ленте подписок пусто" : "Пока нет постов"}
        emptyDescription={mode === "following" ? "Подпишитесь на кого-нибудь — их посты появятся здесь." : "Будьте первым, кто что-то напишет."}
      />
    </div>
  );
}
