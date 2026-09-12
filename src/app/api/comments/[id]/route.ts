import { withErrors, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteComment } from "@/lib/services/posts";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  await deleteComment(id, user.id);
  return ok({ ok: true });
});
