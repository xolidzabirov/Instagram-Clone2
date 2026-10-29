import type { Readable } from "node:stream";

export interface UploadTarget {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
}

/**
 * Object storage behind one interface: the local disk driver today,
 * an S3-compatible driver (MinIO, Cloudflare R2) later without touching callers.
 */
export abstract class StorageDriver {
  /** Where the client should PUT the original file */
  abstract createUploadTarget(mediaId: string, key: string, mime: string): UploadTarget;
  /** Stores a client upload; resolves with the number of bytes written */
  abstract writeStream(key: string, body: Readable, maxBytes: number): Promise<number>;
  abstract putObject(key: string, body: Buffer, mime: string): Promise<void>;
  /** Copies an object to a local file path (processing tools like ffmpeg need files) */
  abstract downloadToFile(key: string, path: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract deleteObjects(keys: string[]): Promise<void>;
}
