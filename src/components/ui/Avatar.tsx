import { initials } from "@/lib/format";
import type { UserSummary } from "@/lib/types";

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl" };

export function Avatar({ user, size = "md" }: { user: Pick<UserSummary, "displayName" | "avatarColor">; size?: keyof typeof sizes }) {
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${sizes[size]}`}
      style={{ backgroundColor: user.avatarColor }}
      aria-hidden="true"
    >
      {initials(user.displayName)}
    </span>
  );
}
