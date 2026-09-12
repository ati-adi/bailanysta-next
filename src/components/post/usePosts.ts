"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Paginated, Post } from "@/lib/types";

export interface PostsQuery {
  author?: string;
  q?: string;
  mode?: "all" | "following";
}

interface FeedState {
  key: string;
  posts: Post[];
  cursor: string | null;
  error: string | null;
}

function buildUrl(query: PostsQuery, cursor: string | null): string {
  const params = new URLSearchParams();
  if (query.author) params.set("author", query.author);
  if (query.q) params.set("q", query.q);
  if (query.mode) params.set("mode", query.mode);
  if (cursor) params.set("cursor", cursor);
  return `/api/posts?${params.toString()}`;
}

/**
 * Загрузка ленты с курсорной пагинацией через /api/posts.
 * Состояние «загрузка» выводится из несовпадения ключа запроса и ключа загруженных данных,
 * поэтому в эффекте нет синхронных setState.
 */
export function usePosts(query: PostsQuery) {
  const { author, q, mode } = query;
  const [version, setVersion] = useState(0);
  const key = `${author ?? ""}|${q ?? ""}|${mode ?? "all"}|${version}`;
  const [state, setState] = useState<FeedState>({ key: "", posts: [], cursor: null, error: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const loading = state.key !== key;

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<Post>>(buildUrl({ author, q, mode }, null))
      .then((page) => !cancelled && setState({ key, posts: page.items, cursor: page.nextCursor, error: null }))
      .catch((e: Error) => !cancelled && setState({ key, posts: [], cursor: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, author, q, mode]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const loadMore = useCallback(async () => {
    if (state.error) return reload();
    if (!state.cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.get<Paginated<Post>>(buildUrl({ author, q, mode }, state.cursor));
      setState((s) => ({ ...s, posts: [...s.posts, ...page.items], cursor: page.nextCursor }));
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message }));
    } finally {
      setLoadingMore(false);
    }
  }, [state.cursor, state.error, loadingMore, author, q, mode, reload]);

  const prepend = useCallback((post: Post) => setState((s) => ({ ...s, posts: [post, ...s.posts] })), []);
  const replace = useCallback(
    (post: Post) => setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === post.id ? post : p)) })),
    [],
  );
  const remove = useCallback((id: string) => setState((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) })), []);

  return {
    posts: state.posts,
    loading,
    loadingMore,
    error: loading ? null : state.error,
    hasMore: Boolean(state.cursor),
    loadMore,
    reload,
    prepend,
    replace,
    remove,
  };
}
