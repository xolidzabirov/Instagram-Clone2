import { ALLOWED_MIME_TYPES, MAX_POST_MEDIA } from "@ig/shared";
import type { Slide } from "../model/types";
import { filterCss, NO_ADJUSTMENTS } from "./filters";
import { place } from "./frame";

/** Published photos are 1080px wide, like Instagram */
const OUTPUT_WIDTH = 1080;

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Cannot read the image"));
    image.src = url;
  });

const loadVideo = (url: string) =>
  new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Cannot read the video"));
    video.src = url;
  });

let nextId = 0;

/** Turns picked files into slides: reads sizes and durations, skips unsupported types */
export async function readFiles(files: File[], room: number): Promise<{ slides: Slide[]; skipped: number }> {
  const accepted = files
    .filter((file) => ALLOWED_MIME_TYPES.IMAGE.includes(file.type) || ALLOWED_MIME_TYPES.VIDEO.includes(file.type))
    // Browsers cannot draw HEIC photos, so they cannot be cropped or filtered here
    .filter((file) => !file.type.startsWith("image/hei"))
    .slice(0, Math.min(room, MAX_POST_MEDIA));
  const slides: Slide[] = [];

  for (const file of accepted) {
    const url = URL.createObjectURL(file);
    try {
      const kind = file.type.startsWith("video/") ? "video" : "image";
      const media = kind === "image" ? await loadImage(url) : await loadVideo(url);
      const width = media instanceof HTMLImageElement ? media.naturalWidth : media.videoWidth;
      const height = media instanceof HTMLImageElement ? media.naturalHeight : media.videoHeight;
      slides.push({
        id: `slide-${nextId++}`,
        file,
        kind,
        url,
        width,
        height,
        durationMs: media instanceof HTMLVideoElement ? Math.round(media.duration * 1000) : null,
        crop: { zoom: 1, panX: 0, panY: 0 },
        filter: "original",
        adjust: NO_ADJUSTMENTS,
        altText: "",
      });
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  return { slides, skipped: files.length - slides.length };
}

/**
 * Bakes crop, filter and corrections into a 1080px JPEG, exactly as previewed.
 * Videos are uploaded as they are.
 */
export async function renderSlide(slide: Slide, aspect: number): Promise<File> {
  if (slide.kind === "video") return slide.file;

  const image = await loadImage(slide.url);
  const width = OUTPUT_WIDTH;
  const height = Math.round(OUTPUT_WIDTH / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const placement = place(slide.width, slide.height, aspect, slide.crop);
  ctx.filter = filterCss(slide.filter, slide.adjust);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, placement.left * width, placement.top * width, placement.width * width, placement.height * width);
  ctx.filter = "none";

  if (slide.adjust.vignette > 0) {
    const radius = Math.hypot(width, height) / 2;
    const gradient = ctx.createRadialGradient(width / 2, height / 2, radius * 0.45, width / 2, height / 2, radius);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${slide.adjust.vignette * 0.75})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Render failed"))), "image/jpeg", 0.92)
  );
  return new File([blob], slide.file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
