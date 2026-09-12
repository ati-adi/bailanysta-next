import { withErrors, ok, readJson } from "@/lib/api";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { createPost, listPosts } from "@/lib/services/posts";
import type { FeedMode } from "@/lib/types";

/** GET /api/posts?cursor=&limit=&author=&q=&mode=all|following */
export const GET = withErrors(async (request) => {
  const viewer = await getCurrentUser();
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "following" ? "following" : "all";
  const page = await listPosts({
    viewerId: viewer?.id ?? null,
    cursor: url.searchParams.get("cursor"),
    limit: Number(url.searchParams.get("limit") ?? 10) || 10,
    author: url.searchParams.get("author") ?? undefined,
    query: url.searchParams.get("q") ?? undefined,
    mode: mode as FeedMode,
  });
  return ok(page);
});

/** POST /api/posts { content } */
export const POST = withErrors(async (request) => {
  const user = await requireUser();
  const body = await readJson<{ content?: string }>(request);
  const post = await createPost(user.id, body.content);
  return ok(post, { status: 201 });
});
