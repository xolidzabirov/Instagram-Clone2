/**
 * Post validation schemas — shared between frontend and API
 */

import { z } from "zod";

export const MAX_POST_MEDIA = 20;
export const MAX_PINNED_POSTS = 3;

export const captionSchema = z.string().max(2200, "Максимум 2200 символов");

export const postTagInputSchema = z.object({
  mediaId: z.uuid(),
  userId: z.uuid(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const postSettings = {
  caption: captionSchema,
  locationId: z.uuid().nullable(),
  /** Up to 20 people tagged per photo */
  tags: z.array(postTagInputSchema).max(MAX_POST_MEDIA * 20),
  /** mediaId → alt text */
  altTexts: z.record(z.uuid(), z.string().trim().max(200)),
  hideLikes: z.boolean(),
  commentsDisabled: z.boolean(),
};

/** POST /posts */
export const createPostSchema = z
  .object({
    type: z.enum(["POST", "REEL"]).default("POST"),
    mediaIds: z
      .array(z.uuid())
      .min(1, "Добавьте хотя бы одно фото или видео")
      .max(MAX_POST_MEDIA, `Максимум ${MAX_POST_MEDIA} фото и видео`)
      .refine((ids) => new Set(ids).size === ids.length, "Медиа повторяются"),
    aspectRatio: z
      .enum(["SQUARE", "PORTRAIT_4_5", "PORTRAIT_3_4", "LANDSCAPE", "VERTICAL_9_16"])
      .default("PORTRAIT_4_5"),
    caption: postSettings.caption.default(""),
    locationId: postSettings.locationId.default(null),
    tags: postSettings.tags.default([]),
    altTexts: postSettings.altTexts.default({}),
    hideLikes: postSettings.hideLikes.default(false),
    commentsDisabled: postSettings.commentsDisabled.default(false),
  })
  .strict();

/** PATCH /posts/:id — media and type cannot change after publishing */
export const updatePostSchema = z.object(postSettings).partial().strict();

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, "Комментарий не может быть пустым").max(1000, "Максимум 1000 символов"),
  parentId: z.uuid().optional(),
});

export type PostTagInput = z.infer<typeof postTagInputSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
