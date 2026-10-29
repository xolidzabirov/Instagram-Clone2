import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MEDIA_LIMITS, type MediaPurpose } from "@ig/shared";
import { encode } from "blurhash";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { DomainEvents, type MediaProcessedEvent } from "../../common/events/events";
import type { Media } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JobQueue } from "../../infra/queue/job-queue";
import { StorageDriver } from "../../infra/storage/storage.driver";
import { ffmpeg, probe } from "./ffmpeg";

export const MEDIA_PROCESS_JOB = "media.process";

/** Reason shown in logs when a file is refused rather than broken by a bug */
class MediaRejected extends Error {}

interface Processed {
  variants: Record<string, string>;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  blurhash: string | null;
}

const IMAGE_SIZES = [1080, 640, 320];
const AVATAR_SIZES = [320, 150];

/** Directory of a media item in storage: media/{owner}/{id}/ */
export const mediaDir = (media: Pick<Media, "ownerId" | "id">) => `media/${media.ownerId}/${media.id}`;

@Injectable()
export class MediaProcessor implements OnModuleInit {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageDriver,
    private readonly queue: JobQueue,
    private readonly events: EventEmitter2
  ) {}

  onModuleInit() {
    this.queue.register<{ mediaId: string }>(MEDIA_PROCESS_JOB, ({ mediaId }) => this.process(mediaId));
  }

  async process(mediaId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.status !== "PROCESSING") return;

    const work = await mkdtemp(join(tmpdir(), "ig-media-"));
    try {
      const input = join(work, "original");
      await this.storage.downloadToFile(media.originalKey, input);

      const result =
        media.type === "IMAGE"
          ? await this.image(media, input)
          : media.type === "VIDEO"
            ? await this.video(media, input, work)
            : await this.audio(media, input, work);

      await this.prisma.media.update({ where: { id: media.id }, data: { status: "READY", ...result } });
      this.emit(media, "READY");
    } catch (error) {
      const reason = error instanceof MediaRejected ? error.message : "processing error";
      this.logger.warn(`Media ${media.id} failed: ${reason}`);
      if (!(error instanceof MediaRejected)) this.logger.error(error instanceof Error ? error.stack : error);
      await this.prisma.media.update({ where: { id: media.id }, data: { status: "FAILED" } });
      this.emit(media, "FAILED");
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  }

  private emit(media: Media, status: MediaProcessedEvent["status"]) {
    const event: MediaProcessedEvent = { mediaId: media.id, ownerId: media.ownerId, status };
    this.events.emit(DomainEvents.MediaProcessed, event);
  }

  /** Auto-rotates by EXIF, strips metadata, writes WebP variants and a blurhash */
  private async image(media: Media, input: string, poster = false): Promise<Processed> {
    let meta: sharp.Metadata;
    try {
      meta = await sharp(input).metadata();
    } catch {
      throw new MediaRejected("not a readable image");
    }
    if (!meta.width || !meta.height) throw new MediaRejected("image has no dimensions");

    // EXIF orientations 5-8 rotate by 90°, swapping width and height
    const swapped = (meta.orientation ?? 1) >= 5;
    const width = swapped ? meta.height : meta.width;
    const height = swapped ? meta.width : meta.height;

    const isAvatar = media.purpose === "AVATAR";
    const variants: Record<string, string> = {};
    for (const size of isAvatar ? AVATAR_SIZES : IMAGE_SIZES) {
      const pipeline = sharp(input).rotate();
      const resized = isAvatar
        ? pipeline.resize(size, size, { fit: "cover" })
        : pipeline.resize({ width: size, withoutEnlargement: true });
      const key = `${mediaDir(media)}/${poster ? "poster-" : ""}${size}.webp`;
      await this.storage.putObject(key, await resized.webp({ quality: 82 }).toBuffer(), "image/webp");
      variants[poster ? (size === 1080 ? "poster" : `poster${size}`) : String(size)] = key;
    }

    return { variants, width, height, durationMs: null, blurhash: await this.blurhash(input) };
  }

  private async blurhash(input: string): Promise<string> {
    const { data, info } = await sharp(input)
      .rotate()
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  }

  private assertDuration(purpose: MediaPurpose, durationMs: number | null) {
    if (durationMs === null) throw new MediaRejected("duration unknown");
    const max = MEDIA_LIMITS[purpose].maxDurationMs;
    if (max && durationMs > max + 500) throw new MediaRejected(`longer than ${max / 1000}s`);
  }

  /** H.264 MP4 (max 720px wide, fast start) plus a WebP poster */
  private async video(media: Media, input: string, work: string): Promise<Processed> {
    const info = await probe(input);
    if (!info.hasVideo) throw new MediaRejected("no video stream");
    this.assertDuration(media.purpose as MediaPurpose, info.durationMs);

    const output = join(work, "video.mp4");
    await ffmpeg([
      "-y", "-i", input,
      "-vf", "scale='trunc(min(720,iw)/2)*2':-2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      ...(info.hasAudio ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]),
      "-movflags", "+faststart",
      output,
    ]);

    const posterFile = join(work, "poster.png");
    await ffmpeg(["-y", "-i", output, "-frames:v", "1", posterFile]);
    const poster = await this.image(media, posterFile, true);

    const mp4Key = `${mediaDir(media)}/video.mp4`;
    await this.storage.putObject(mp4Key, await readFile(output), "video/mp4");

    return { ...poster, variants: { mp4: mp4Key, ...poster.variants }, durationMs: info.durationMs };
  }

  /** Voice messages: AAC in an M4A container */
  private async audio(media: Media, input: string, work: string): Promise<Processed> {
    const info = await probe(input);
    if (!info.hasAudio) throw new MediaRejected("no audio stream");
    this.assertDuration(media.purpose as MediaPurpose, info.durationMs);

    const output = join(work, "audio.m4a");
    await ffmpeg(["-y", "-i", input, "-vn", "-c:a", "aac", "-b:a", "96k", output]);
    const key = `${mediaDir(media)}/audio.m4a`;
    await this.storage.putObject(key, await readFile(output), "audio/mp4");

    return { variants: { audio: key }, width: null, height: null, durationMs: info.durationMs, blurhash: null };
  }
}
