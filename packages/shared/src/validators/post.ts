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

/** PUT /posts/:id/save — optionally into one of your collections */
export const savePostSchema = z.object({ collectionId: z.uuid().nullable().optional() }).strict();

export const collectionNameSchema = z.string().trim().min(1, "Введите название").max(100, "Максимум 100 символов");
export const createCollectionSchema = z.object({ name: collectionNameSchema }).strict();
export const updateCollectionSchema = z.object({ name: collectionNameSchema }).strict();

/** GET /users/me/saved */
export const savedPostsQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  collectionId: z.uuid().optional(),
});

export type SavePostInput = z.infer<typeof savePostSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type SavedPostsQuery = z.infer<typeof savedPostsQuerySchema>;
export type PostTagInput = z.infer<typeof postTagInputSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
