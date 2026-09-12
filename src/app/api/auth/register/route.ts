import { withErrors, ok, readJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { registerUser } from "@/lib/services/users";

export const POST = withErrors(async (request) => {
  const body = await readJson<{ username?: string; displayName?: string; password?: string }>(request);
  const user = await registerUser({
    username: body.username ?? "",
    displayName: body.displayName ?? "",
    password: body.password ?? "",
  });
  await createSession(user.id);
  return ok({ user }, { status: 201 });
});
