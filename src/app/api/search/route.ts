import { withErrors, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { listPosts, trendingHashtags } from "@/lib/services/posts";
import { searchUsers } from "@/lib/services/users";

/** GET /api/search?q=&cursor= — посты + пользователи + тренды */
export const GET = withErrors(async (request) => {
  const viewer = await getCurrentUser();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const cursor = url.searchParams.get("cursor");
  if (!q) return ok({ posts: { items: [], nextCursor: null }, users: [], trending: await trendingHashtags() });
  const [posts, users] = await Promise.all([
    listPosts({ viewerId: viewer?.id ?? null, cursor, query: q }),
    cursor ? Promise.resolve([]) : searchUsers(q),
  ]);
  return ok({ posts, users, trending: [] });
});
