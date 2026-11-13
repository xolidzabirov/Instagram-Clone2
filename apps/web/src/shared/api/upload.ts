import axios from "axios";
import { ALLOWED_MIME_TYPES, type MediaInfo, type MediaPurpose, type MediaType, type MediaUpload } from "@ig/shared";
import { API_URL } from "@/shared/config";
import { ApiError } from "./errors";
import { http } from "./http";

function mediaTypeOf(mime: string): MediaType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES) as [MediaType, readonly string[]][]) {
    if (mimes.includes(mime)) return type;
  }
  return null;
}

/**
 * The local storage driver answers with an absolute URL on the API host. The browser must go
 * through the site's own origin instead (rewrites, cookies, no CORS), so keep only the path.
 * Real S3 presigned URLs point elsewhere and are used as they are.
 */
function toRequestUrl(uploadUrl: string) {
  const url = new URL(uploadUrl, window.location.origin);
  return url.pathname.startsWith(`${API_URL}/`) ? url.pathname.slice(API_URL.length) + url.search : url.toString();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uploads a file the way the API expects (docs/04-api.md, Media): reserve → PUT the body →
 * complete → wait until processing is done. Resolves with the ready media.
 */
export async function uploadMedia(
  file: File,
  purpose: MediaPurpose,
  onProgress?: (fraction: number) => void
): Promise<MediaInfo> {
  const type = mediaTypeOf(file.type);
  if (!type) throw new ApiError(400, "UNSUPPORTED_MEDIA", file.type || "unknown type");

  const { data: upload } = await http.post<MediaUpload>("/media/uploads", {
    type,
    purpose,
    mime: file.type,
    sizeBytes: file.size,
  });

  const target = toRequestUrl(upload.uploadUrl);
  // Our API needs the bearer token; an external presigned URL must not receive it
  const client = target.startsWith("/") ? http : axios;
  await client.request({
    method: upload.method,
    url: target,
    headers: { ...upload.headers, "Content-Type": file.type },
    data: file,
    timeout: 0,
    onUploadProgress: (event) => event.total && onProgress?.(event.loaded / event.total),
  });

  let { data: media } = await http.post<MediaInfo>(`/media/${upload.mediaId}/complete`);
  for (let attempt = 0; media.status === "PROCESSING" || media.status === "UPLOADING"; attempt++) {
    if (attempt > 60) throw new ApiError(504, "MEDIA_TIMEOUT", "Processing takes too long");
    await sleep(attempt < 5 ? 400 : 1000);
    ({ data: media } = await http.get<MediaInfo>(`/media/${upload.mediaId}`));
  }
  if (media.status === "FAILED") throw new ApiError(422, "MEDIA_FAILED", "Processing failed");
  return media;
}
