import Image from "next/image";
import { cn } from "@/shared/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, { container: string; px: number }> = {
  xs: { container: "w-6 h-6", px: 24 },
  sm: { container: "w-8 h-8", px: 32 },
  md: { container: "w-11 h-11", px: 44 },
  lg: { container: "w-20 h-20", px: 80 },
  xl: { container: "w-[150px] h-[150px]", px: 150 },
};

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  hasStory?: boolean;
  hasUnseenStory?: boolean;
  className?: string;
}

export function UserAvatar({
  src,
  alt,
  size = "md",
  hasStory = false,
  hasUnseenStory = false,
  className,
}: UserAvatarProps) {
  const { container, px } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative rounded-full flex-shrink-0",
        hasStory && "p-[2px]",
        hasStory &&
          (hasUnseenStory
            ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
            : "bg-zinc-300 dark:bg-zinc-600"),
        className
      )}
    >
      <div
        className={cn(
          container,
          "rounded-full overflow-hidden",
          hasStory && "border-2 border-white dark:border-black"
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
}
