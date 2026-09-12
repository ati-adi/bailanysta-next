import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/services/users";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePosts } from "@/components/profile/ProfilePosts";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username, null);
  return { title: profile ? `${profile.displayName} (@${profile.username})` : "Профиль" };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfile(username, viewer?.id ?? null);
  if (!profile) notFound();

  return (
    <div className="space-y-4">
      <ProfileHeader key={profile.id} profile={profile} />
      <ProfilePosts username={profile.username} />
    </div>
  );
}
