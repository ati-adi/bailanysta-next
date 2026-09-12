import { withErrors, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { addComment, listComments } from "@/lib/services/posts";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  return ok({ items: await listComments(id) });
});

export const POST = withErrors<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const body = await readJson<{ content?: string }>(request);
  return ok(await addComment(id, user, body.content), { status: 201 });
});
