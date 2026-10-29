import type { MediaPurpose, MediaType } from "../validators/media";

export type MediaStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

/** Response of POST /media/uploads: send the file body to `uploadUrl` */
export interface MediaUpload {
  mediaId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

export interface MediaInfo {
  id: string;
  type: MediaType;
  purpose: MediaPurpose;
  status: MediaStatus;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  blurhash: string | null;
  /** Image: "1080" | "640" | "320" (avatars "320" | "150"); video: "mp4" | "poster"; audio: "audio" */
  urls: Record<string, string>;
}
