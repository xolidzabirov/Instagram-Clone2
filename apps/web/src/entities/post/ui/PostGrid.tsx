import Image from "next/image";
import type { PostPreview } from "@ig/shared";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { MdCollections } from "react-icons/md";

interface PostGridProps {
  posts: PostPreview[];
  onPostClick?: (postId: string) => void;
}

export function PostGrid({ posts, onPostClick }: PostGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick?.(post.id)}
          className="relative aspect-square group bg-zinc-100 dark:bg-zinc-900"
        >
          <Image
            src={post.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 33vw, 310px"
          />

          {/* Multi-image indicator */}
          {post.isMultiple && (
            <MdCollections className="absolute top-2 right-2 w-5 h-5 text-white drop-shadow" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
            <span className="flex items-center gap-1 text-white font-semibold text-sm">
              <FiHeart className="w-5 h-5 fill-white" />
              {post.likesCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-white font-semibold text-sm">
              <FiMessageCircle className="w-5 h-5 fill-white" />
              {post.commentsCount.toLocaleString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
