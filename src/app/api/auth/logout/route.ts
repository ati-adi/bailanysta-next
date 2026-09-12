import { withErrors, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const POST = withErrors(async () => {
  await destroySession();
  return ok({ ok: true });
});
