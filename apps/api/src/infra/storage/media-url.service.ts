import { Inject, Injectable } from "@nestjs/common";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";

type Variants = Record<string, string>;

/** Turns stored media keys into public URLs */
@Injectable()
export class MediaUrlService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  /** Absolute URLs (e.g. seed data) are returned as-is; bucket keys get the public base URL */
  resolve(keyOrUrl: string): string {
    if (/^https?:\/\//.test(keyOrUrl)) return keyOrUrl;
    return `${this.env.MEDIA_PUBLIC_URL.replace(/\/$/, "")}/${keyOrUrl.replace(/^\//, "")}`;
  }

  /** Picks the first available variant in order of preference */
  pick(variants: unknown, preferred: string[]): string | null {
    if (!variants || typeof variants !== "object") return null;
    const map = variants as Variants;
    const key = preferred.find((size) => typeof map[size] === "string");
    return key ? this.resolve(map[key]!) : null;
  }

  avatar(media: { variants: unknown } | null | undefined): string | null {
    return media ? this.pick(media.variants, ["320", "150"]) : null;
  }
}
