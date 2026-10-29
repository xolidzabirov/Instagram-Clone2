import { z } from "zod";

export const MEDIA_TYPES = ["IMAGE", "VIDEO", "AUDIO"] as const;
export const MEDIA_PURPOSES = ["POST", "REEL", "STORY", "AVATAR", "MESSAGE"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

const MB = 1024 * 1024;

export const ALLOWED_MIME_TYPES: Record<MediaType, readonly string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  VIDEO: ["video/mp4", "video/quicktime", "video/webm"],
  AUDIO: ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"],
};

interface PurposeLimits {
  types: readonly MediaType[];
  maxBytes: Partial<Record<MediaType, number>>;
  maxDurationMs?: number;
}

/** docs/01-tz.md, section 7 */
export const MEDIA_LIMITS: Record<MediaPurpose, PurposeLimits> = {
  POST: { types: ["IMAGE", "VIDEO"], maxBytes: { IMAGE: 20 * MB, VIDEO: 500 * MB }, maxDurationMs: 60_000 },
  REEL: { types: ["VIDEO"], maxBytes: { VIDEO: 500 * MB }, maxDurationMs: 180_000 },
  STORY: { types: ["IMAGE", "VIDEO"], maxBytes: { IMAGE: 20 * MB, VIDEO: 500 * MB }, maxDurationMs: 60_000 },
  AVATAR: { types: ["IMAGE"], maxBytes: { IMAGE: 10 * MB } },
  MESSAGE: {
    types: ["IMAGE", "VIDEO", "AUDIO"],
    maxBytes: { IMAGE: 20 * MB, VIDEO: 500 * MB, AUDIO: 10 * MB },
    maxDurationMs: 60_000,
  },
};

/** POST /media/uploads */
export const createUploadSchema = z
  .object({
    type: z.enum(MEDIA_TYPES),
    purpose: z.enum(MEDIA_PURPOSES),
    mime: z.string().trim().toLowerCase().max(100),
    sizeBytes: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    const limits = MEDIA_LIMITS[value.purpose];
    if (!limits.types.includes(value.type)) {
      ctx.addIssue({ code: "custom", path: ["type"], message: `${value.type} is not allowed for ${value.purpose}` });
      return;
    }
    if (!ALLOWED_MIME_TYPES[value.type].includes(value.mime)) {
      ctx.addIssue({ code: "custom", path: ["mime"], message: "Неподдерживаемый формат файла" });
    }
    const max = limits.maxBytes[value.type] ?? 0;
    if (value.sizeBytes > max) {
      ctx.addIssue({ code: "custom", path: ["sizeBytes"], message: `Файл больше ${Math.round(max / MB)} МБ` });
    }
  });

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
