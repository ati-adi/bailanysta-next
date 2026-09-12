"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostListSkeleton } from "@/components/ui/Skeleton";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

interface Props {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onChange: (post: Post) => void;
  onDelete: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function PostList({ posts, loading, loadingMore, hasMore, error, onLoadMore, onChange, onDelete, emptyTitle, emptyDescription }: Props) {
  if (loading) return <PostListSkeleton />;
  if (error) return <EmptyState title="Не удалось загрузить посты" description={error} action={<Button variant="secondary" onClick={onLoadMore}>Повторить</Button>} />;
  if (posts.length === 0) return <EmptyState title={emptyTitle ?? "Пока нет постов"} description={emptyDescription} />;

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onChange={onChange} onDelete={onDelete} />
      ))}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button variant="secondary" onClick={onLoadMore} loading={loadingMore}>
            Показать ещё
          </Button>
        </div>
      )}
    </div>
  );
}
