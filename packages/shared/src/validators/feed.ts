import { z } from "zod";

export const FEED_MODES = ["home", "following", "favorites"] as const;
export type FeedMode = (typeof FEED_MODES)[number];

/** GET /feed */
export const feedQuerySchema = z.object({
  mode: z.enum(FEED_MODES).default("home"),
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

/** PUT /topics/me/:topicId */
export const topicWeightSchema = z.object({ weight: z.number().min(-1).max(1) }).strict();

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type TopicWeightInput = z.infer<typeof topicWeightSchema>;
