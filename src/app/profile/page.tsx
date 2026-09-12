import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** /profile → свой профиль или логин */
export default async function MyProfileRedirect() {
  const user = await getCurrentUser();
  redirect(user ? `/profile/${user.username}` : "/login?next=/profile");
}
