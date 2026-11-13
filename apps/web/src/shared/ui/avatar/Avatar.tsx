import Image from "next/image";
import { DEFAULT_AVATAR } from "@/shared/config";
import { cn } from "@/shared/lib";

const sizes = {
  xs: { box: "size-6", px: 24 },
  sm: { box: "size-8", px: 32 },
  md: { box: "size-11", px: 44 },
  /** Story tray */
  lg: { box: "size-[66px]", px: 66 },
  /** Profile header on phones */
  xl: { box: "size-[77px]", px: 77 },
  /** Profile header on desktop */
  "2xl": { box: "size-[150px]", px: 150 },
};

export type AvatarSize = keyof typeof sizes;

/**
 * Story ring around the picture:
 * "unseen" gradient, "seen" grey, "close-friends" green, "none" no ring.
 */
export type AvatarRing = "none" | "unseen" | "seen" | "close-friends";

const rings: Record<Exclude<AvatarRing, "none">, string> = {
  unseen: "bg-[linear-gradient(45deg,#f09433,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888)]",
  seen: "bg-separator",
  "close-friends": "bg-success",
};

interface AvatarProps {
  /** null → default silhouette */
  src: string | null;
  alt: string;
  size?: AvatarSize;
  ring?: AvatarRing;
  className?: string;
}

export function Avatar({ src, alt, size = "md", ring = "none", className }: AvatarProps) {
  const { box, px } = sizes[size];
  const hasRing = ring !== "none";
  // Thicker ring on large avatars, like the story tray and profile header
  const ringWidth = px >= 66 ? "p-[3px]" : "p-[2px]";

  return (
    <div className={cn("relative shrink-0 rounded-full", hasRing && ringWidth, hasRing && rings[ring], className)}>
      <div className={cn(box, "overflow-hidden rounded-full bg-control", hasRing && "border-2 border-background")}>
        <Image
          src={src ?? DEFAULT_AVATAR}
          alt={alt}
          width={px}
          height={px}
          // The local SVG fallback is served as-is (the optimizer does not process SVG)
          unoptimized={!src}
          className="size-full object-cover"
        />
      </div>
    </div>
  );
}
