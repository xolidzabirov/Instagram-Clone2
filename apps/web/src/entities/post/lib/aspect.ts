import type { AspectRatio, PostMediaItem } from "@ig/shared";

/** width / height of each aspect ratio a post can have */
export const ASPECT_VALUE: Record<AspectRatio, number> = {
  SQUARE: 1,
  PORTRAIT_4_5: 4 / 5,
  PORTRAIT_3_4: 3 / 4,
  LANDSCAPE: 16 / 9,
  VERTICAL_9_16: 9 / 16,
};

/** How a post is framed in the feed: vertical Reels are cropped to 4:5 like Instagram does */
export function feedAspect(ratio: AspectRatio) {
  return ratio === "VERTICAL_9_16" ? ASPECT_VALUE.PORTRAIT_4_5 : ASPECT_VALUE[ratio];
}

/** Best image URL for a ~470px wide card on a 2x screen */
export function mediaImageUrl(item: PostMediaItem) {
  return item.urls["1080"] ?? item.urls["640"] ?? item.urls["poster"] ?? item.urls["320"] ?? null;
}
