"use client";

import Link from "next/link";
import { useState } from "react";
import { Comments } from "@/components/comment/Comments";
import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

export function PostDetail({ post: initial }: { post: Post }) {
  const [post, setPost] = useState(initial);
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-muted hover:text-text">← В ленту</Link>
      <PostCard post={post} onChange={setPost} standalone />
      <Comments postId={post.id} onCountChange={(d) => setPost((p) => ({ ...p, commentCount: p.commentCount + d }))} />
    </div>
  );
}
