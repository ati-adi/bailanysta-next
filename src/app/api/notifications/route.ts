import { withErrors, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/services/notifications";

export const GET = withErrors(async (request) => {
  const user = await requireUser();
  const cursor = new URL(request.url).searchParams.get("cursor");
  return ok(await listNotifications(user.id, cursor));
});
