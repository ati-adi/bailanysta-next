import { withErrors, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { setLike } from "@/lib/services/posts";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  return ok(await setLike(id, user.id, true));
});

export const DELETE = withErrors<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  return ok(await setLike(id, user.id, false));
});
