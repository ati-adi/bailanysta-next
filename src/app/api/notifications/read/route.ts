import { withErrors, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/lib/services/notifications";

export const POST = withErrors(async () => {
  const user = await requireUser();
  await markAllRead(user.id);
  return ok({ ok: true });
});
