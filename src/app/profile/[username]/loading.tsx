import { PostListSkeleton, ProfileSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <ProfileSkeleton />
      <PostListSkeleton count={2} />
    </div>
  );
}
