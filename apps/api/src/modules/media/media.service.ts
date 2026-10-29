import { HttpStatus, Injectable } from "@nestjs/common";
import type { CreateUploadInput, MediaInfo, MediaUpload } from "@ig/shared";
import type { Readable } from "node:stream";
import { v7 as uuidv7 } from "uuid";
import { AppError } from "../../common/errors/app-error";
import type { Media } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JobQueue } from "../../infra/queue/job-queue";
import { MediaUrlService } from "../../infra/storage/media-url.service";
import { StorageDriver } from "../../infra/storage/storage.driver";
import { MEDIA_PROCESS_JOB, mediaDir } from "./media.processor";

const notFound = () => new AppError("MEDIA_NOT_FOUND", "Media not found", HttpStatus.NOT_FOUND);

/**
 * Upload flow (docs/02-architecture.md, 5.3):
 * 1. POST /media/uploads → row in UPLOADING + upload URL
 * 2. PUT the file to that URL
 * 3. POST /media/:id/complete → PROCESSING, background job → READY | FAILED
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageDriver,
    private readonly queue: JobQueue,
    private readonly urls: MediaUrlService
  ) {}

  async createUpload(ownerId: string, input: CreateUploadInput): Promise<MediaUpload> {
    const id = uuidv7();
    const originalKey = `${mediaDir({ ownerId, id })}/original`;
    await this.prisma.media.create({
      data: {
        id,
        ownerId,
        type: input.type,
        purpose: input.purpose,
        mime: input.mime,
        sizeBytes: input.sizeBytes,
        originalKey,
      },
    });
    const target = this.storage.createUploadTarget(id, originalKey, input.mime);
    return { mediaId: id, uploadUrl: target.url, method: target.method, headers: target.headers };
  }

  /** Local storage driver only: the client PUTs the file body to the API itself */
  async receiveUpload(ownerId: string, mediaId: string, body: Readable): Promise<void> {
    const media = await this.owned(ownerId, mediaId);
    if (media.status !== "UPLOADING") {
      throw new AppError("UPLOAD_CLOSED", "This media was already uploaded", HttpStatus.CONFLICT);
    }
    const written = await this.storage.writeStream(media.originalKey, body, media.sizeBytes);
    if (written === 0) {
      throw new AppError("EMPTY_UPLOAD", "The uploaded file is empty", HttpStatus.BAD_REQUEST);
    }
    await this.prisma.media.update({ where: { id: media.id }, data: { sizeBytes: written } });
  }

  async complete(ownerId: string, mediaId: string): Promise<MediaInfo> {
    const media = await this.owned(ownerId, mediaId);
    if (media.status !== "UPLOADING") return this.present(media);
    if (!(await this.storage.exists(media.originalKey))) {
      throw new AppError("NOT_UPLOADED", "Upload the file before completing", HttpStatus.CONFLICT);
    }

    // Conditional update: a double "complete" must not enqueue processing twice
    const { count } = await this.prisma.media.updateMany({
      where: { id: media.id, status: "UPLOADING" },
      data: { status: "PROCESSING" },
    });
    if (count === 1) this.queue.enqueue(MEDIA_PROCESS_JOB, { mediaId: media.id });

    return this.get(ownerId, mediaId);
  }

  async get(ownerId: string, mediaId: string): Promise<MediaInfo> {
    return this.present(await this.owned(ownerId, mediaId));
  }

  /** Media stays private to its owner until it is attached to a post, story or message */
  private async owned(ownerId: string, mediaId: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.ownerId !== ownerId) throw notFound();
    return media;
  }

  private present(media: Media): MediaInfo {
    const variants = (media.variants ?? {}) as Record<string, string>;
    return {
      id: media.id,
      type: media.type,
      purpose: media.purpose === "AUDIO" ? "MESSAGE" : media.purpose,
      status: media.status,
      width: media.width,
      height: media.height,
      durationMs: media.durationMs,
      blurhash: media.blurhash,
      urls: Object.fromEntries(Object.entries(variants).map(([name, key]) => [name, this.urls.resolve(key)])),
    };
  }
}
