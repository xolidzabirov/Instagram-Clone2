import { Skeleton } from "@/shared/ui";

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-7 px-4 pt-4 md:mb-11 md:items-start md:gap-0 md:px-0 md:pt-0" aria-hidden>
      <div className="flex shrink-0 md:w-[283px] md:justify-center md:pr-7">
        <Skeleton className="size-[77px] rounded-full md:size-[150px]" />
      </div>
      <div className="flex flex-1 flex-col gap-4 md:gap-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <div className="flex flex-col gap-2 max-md:hidden">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
    </div>
  );
}
