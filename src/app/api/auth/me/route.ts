import { withErrors, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { countUnread } from "@/lib/services/notifications";

export const GET = withErrors(async () => {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;
  return ok({ user, unreadNotifications: unread });
});
