"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { PostComposer } from "@/components/post/PostComposer";
import { PostList } from "@/components/post/PostList";
import { usePosts } from "@/components/post/usePosts";

/** Лента конкретного пользователя; на своей странице сверху есть композер. */
export function ProfilePosts({ username }: { username: string }) {
  const { user } = useAuth();
  const feed = usePosts({ author: username });
  const isMe = user?.username.toLowerCase() === username.toLowerCase();

  return (
    <div className="space-y-4">
      {isMe && <PostComposer onCreated={feed.prepend} />}
      <PostList
        {...feed}
        onLoadMore={feed.loadMore}
        onChange={feed.replace}
        onDelete={feed.remove}
        emptyTitle={isMe ? "У вас пока нет постов" : "Пользователь ещё ничего не написал"}
        emptyDescription={isMe ? "Напишите первый пост выше." : undefined}
      />
    </div>
  );
}
