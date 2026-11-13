import { ProfileHeaderSkeleton } from "@/widgets/profile-header";

/** Prerendered shell of a profile while the username from the URL is resolved */
export function ProfileFallback() {
  return (
    <div className="w-full max-w-[975px] md:px-5 md:pt-[30px]">
      <ProfileHeaderSkeleton />
    </div>
  );
}
