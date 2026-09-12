import type { Metadata } from "next";
import { Feed } from "@/components/post/Feed";
import { Trending } from "@/components/search/Trending";

export const metadata: Metadata = { title: "Лента" };

export default function HomePage() {
  return (
    <div className="space-y-4">
      <Trending />
      <Feed />
    </div>
  );
}
