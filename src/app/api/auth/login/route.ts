import { withErrors, ok, fail, readJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { authenticate } from "@/lib/services/users";

export const POST = withErrors(async (request) => {
  const body = await readJson<{ username?: string; password?: string }>(request);
  const user = await authenticate(body.username ?? "", body.password ?? "");
  if (!user) return fail("Неверный логин или пароль", 401);
  await createSession(user.id);
  return ok({ user });
});
