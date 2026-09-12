/** DTO-типы, которые отдаёт API и которыми оперируют компоненты. */

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
}

export interface UserProfile extends UserSummary {
  bio: string;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  /** Подписан ли текущий пользователь на этого; null — если не авторизован или это он сам */
  isFollowedByMe: boolean | null;
  isMe: boolean;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  author: UserSummary;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: UserSummary;
}

export type NotificationType = "like" | "comment" | "follow";

export interface Notification {
  id: string;
  type: NotificationType;
  actor: UserSummary;
  postId: string | null;
  postPreview: string | null;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export type FeedMode = "all" | "following";
