import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPost } from "@/lib/services/posts";
import { PostDetail } from "@/components/post/PostDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id, null);
  return { title: post ? `${post.author.displayName}: ${post.content.slice(0, 60)}` : "Пост" };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const post = await getPost(id, viewer?.id ?? null);
  if (!post) notFound();
  return <PostDetail post={post} />;
}
