import { withErrors, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { setFollow } from "@/lib/services/users";

type Ctx = { params: Promise<{ username: string }> };

export const POST = withErrors<Ctx>(async (_request, { params }) => {
  const { username } = await params;
  const user = await requireUser();
  return ok(await setFollow(user.id, username, true));
});

export const DELETE = withErrors<Ctx>(async (_request, { params }) => {
  const { username } = await params;
  const user = await requireUser();
  return ok(await setFollow(user.id, username, false));
});
