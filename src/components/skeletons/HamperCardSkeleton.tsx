import { Shimmer } from './Shimmer';

export function HamperCardSkeleton() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-[#E5C57B]/30 dark:border-[#33020A] bg-white dark:bg-[#1A1115] p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* Top Image Box */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <Shimmer className="h-full w-full" />
        {/* Fake Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-[#57222C]/15 dark:bg-[#FBDE9C]/10" />
        </div>
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/60 dark:bg-black/40" />
      </div>

      {/* Content Skeleton */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div className="space-y-2.5">
          {/* Category Pill */}
          <div className="h-3 w-20 rounded-full bg-[#E5C57B]/40 dark:bg-[#FBDE9C]/20" />
          
          {/* Title */}
          <div className="h-5 w-4/5 rounded-lg bg-[#57222C]/15 dark:bg-[#FAF5E8]/15" />
          
          {/* Subtitle / Description lines */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
            <div className="h-3 w-2/3 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
          </div>
        </div>

        {/* Price & Action Button Skeleton */}
        <div className="mt-6 flex items-center justify-between border-t border-[#E5C57B]/20 dark:border-[#33020A] pt-3">
          <div className="space-y-1">
            <div className="h-5 w-20 rounded-md bg-[#57222C]/20 dark:bg-[#FBDE9C]/20" />
            <div className="h-3 w-12 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
          </div>
          <div className="h-9 w-24 rounded-full bg-[#57222C]/20 dark:bg-[#FBDE9C]/20" />
        </div>
      </div>
    </div>
  );
}
