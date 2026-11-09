import type { PostPreview } from "@ig/shared";
import type { MockPost } from "../model/types";

export function toPostPreview(post: MockPost): PostPreview {
  return {
    id: post.id,
    type: "POST",
    thumbnail: post.images[0]?.url ?? null,
    blurhash: null,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    viewsCount: 0,
    isMultiple: post.images.length > 1,
    isVideo: false,
    isPinned: false,
  };
}
