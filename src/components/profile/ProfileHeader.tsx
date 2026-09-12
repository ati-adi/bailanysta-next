"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label, Textarea } from "@/components/ui/Field";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { UserProfile } from "@/lib/types";
import { FollowButton } from "./FollowButton";

export function ProfileHeader({ profile: initial }: { profile: UserProfile }) {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.patch<UserProfile>("/api/profile", { displayName, bio });
      setProfile(updated);
      setEditing(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start gap-4">
        <Avatar user={profile} size="lg" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label htmlFor="displayName">Имя</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} required />
              </div>
              <div>
                <Label htmlFor="bio">О себе</Label>
                <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} />
              </div>
              <ErrorText>{error}</ErrorText>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={busy}>Отмена</Button>
                <Button type="submit" size="sm" loading={busy}>Сохранить</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold">{profile.displayName}</h1>
                  <p className="text-sm text-muted">@{profile.username}</p>
                </div>
                {profile.isMe ? (
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Редактировать</Button>
                ) : (
                  <FollowButton
                    username={profile.username}
                    initialFollowing={Boolean(profile.isFollowedByMe)}
                    onChange={(following, followerCount) => setProfile((p) => ({ ...p, isFollowedByMe: following, followerCount }))}
                  />
                )}
              </div>
              {profile.bio && <p className="mt-2 whitespace-pre-wrap text-sm">{profile.bio}</p>}
              <p className="mt-2 text-xs text-muted">На Bailanysta с {formatDate(profile.createdAt)}</p>
            </>
          )}
        </div>
      </div>
      <dl className="mt-4 flex gap-6 text-sm">
        <div><dt className="inline font-semibold">{profile.postCount}</dt> <dd className="inline text-muted">постов</dd></div>
        <div><dt className="inline font-semibold">{profile.followerCount}</dt> <dd className="inline text-muted">подписчиков</dd></div>
        <div><dt className="inline font-semibold">{profile.followingCount}</dt> <dd className="inline text-muted">подписок</dd></div>
      </dl>
    </section>
  );
}
