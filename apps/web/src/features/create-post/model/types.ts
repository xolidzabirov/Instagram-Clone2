import type { AspectRatio } from "@ig/shared";
import type { Crop } from "../lib/frame";
import type { Adjustments, FilterId } from "../lib/filters";

export interface Slide {
  id: string;
  file: File;
  kind: "image" | "video";
  /** Object URL of the original file, revoked when the dialog closes */
  url: string;
  width: number;
  height: number;
  durationMs: number | null;
  crop: Crop;
  filter: FilterId;
  adjust: Adjustments;
  altText: string;
}

export type Step = "select" | "crop" | "edit" | "details" | "sharing";

/** Ratios offered in the crop menu (Reels are always 9:16) */
export const ASPECT_OPTIONS: { ratio: AspectRatio; label: string; value: number }[] = [
  { ratio: "SQUARE", label: "1:1", value: 1 },
  { ratio: "PORTRAIT_4_5", label: "4:5", value: 4 / 5 },
  { ratio: "PORTRAIT_3_4", label: "3:4", value: 3 / 4 },
  { ratio: "LANDSCAPE", label: "16:9", value: 16 / 9 },
];

export const REEL_ASPECT = 9 / 16;
