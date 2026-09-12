import { withErrors, ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/services/users";

type Ctx = { params: Promise<{ username: string }> };

export const GET = withErrors<Ctx>(async (_request, { params }) => {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfile(username, viewer?.id ?? null);
  if (!profile) return fail("Пользователь не найден", 404);
  return ok(profile);
});
