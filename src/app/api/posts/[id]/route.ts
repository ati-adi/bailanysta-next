import { withErrors, ok, fail, readJson } from "@/lib/api";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { deletePost, getPost, updatePost } from "@/lib/services/posts";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const post = await getPost(id, viewer?.id ?? null);
  if (!post) return fail("Пост не найден", 404);
  return ok(post);
});

export const PATCH = withErrors<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const body = await readJson<{ content?: string }>(request);
  return ok(await updatePost(id, user.id, body.content));
});

export const DELETE = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  await deletePost(id, user.id);
  return ok({ ok: true });
});
