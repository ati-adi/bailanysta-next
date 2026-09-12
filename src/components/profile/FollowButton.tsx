"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";

export function FollowButton({
  username,
  initialFollowing,
  onChange,
}: {
  username: string;
  initialFollowing: boolean;
  onChange?: (following: boolean, followerCount: number) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) return router.push("/login");
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = next
        ? await api.post<{ followerCount: number }>(`/api/users/${username}/follow`)
        : await api.delete<{ followerCount: number }>(`/api/users/${username}/follow`);
      onChange?.(next, res.followerCount);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={following ? "secondary" : "primary"} size="sm" onClick={toggle} loading={busy} aria-pressed={following}>
      {following ? "Вы подписаны" : "Подписаться"}
    </Button>
  );
}
