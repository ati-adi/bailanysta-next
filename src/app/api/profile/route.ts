import { withErrors, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getProfile, updateProfile } from "@/lib/services/users";

/** PATCH /api/profile { displayName?, bio? } — редактирование своего профиля */
export const PATCH = withErrors(async (request) => {
  const user = await requireUser();
  const body = await readJson<{ displayName?: string; bio?: string }>(request);
  await updateProfile(user.id, body);
  return ok(await getProfile(user.username, user.id));
});
