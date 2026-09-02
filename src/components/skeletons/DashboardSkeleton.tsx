import { Shimmer } from './Shimmer';

export function OrderCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[#E5C57B]/30 dark:border-[#33020A] bg-white dark:bg-[#1A1115] p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5C57B]/20 dark:border-[#33020A] pb-4">
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded bg-[#57222C]/15 dark:bg-[#FBDE9C]/15" />
          <div className="h-3 w-24 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
        </div>
        <div className="h-6 w-20 rounded-full bg-[#57222C]/10 dark:bg-[#FBDE9C]/15" />
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          <Shimmer className="h-full w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[#57222C]/15 dark:bg-[#FAF5E8]/15" />
          <div className="h-3 w-1/2 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
        </div>
        <div className="h-5 w-16 rounded bg-[#57222C]/15 dark:bg-[#FBDE9C]/15" />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="h-3 w-28 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
        <div className="h-8 w-24 rounded-full bg-[#57222C]/15 dark:bg-[#FBDE9C]/15" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="rounded-[2rem] bg-[#57222C]/15 dark:bg-[#33020A] p-7 sm:p-10 border border-[#E5C57B]/20">
        <div className="h-3 w-36 rounded-full bg-[#57222C]/20 dark:bg-[#FBDE9C]/20 mb-4" />
        <div className="h-8 w-64 rounded-lg bg-[#57222C]/20 dark:bg-[#FBDE9C]/20 mb-3" />
        <div className="h-4 w-96 max-w-full rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[#E5C57B]/30 dark:border-[#33020A] bg-white dark:bg-[#1A1115] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-xl bg-[#57222C]/15 dark:bg-[#FBDE9C]/15" />
              <div className="h-4 w-12 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
            </div>
            <div className="h-6 w-20 rounded bg-[#57222C]/20 dark:bg-[#FBDE9C]/20" />
            <div className="h-3 w-28 rounded bg-[#57222C]/10 dark:bg-[#FAF5E8]/10" />
          </div>
        ))}
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-[#57222C]/20 dark:bg-[#FAF5E8]/20" />
        <div className="grid gap-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    </div>
  );
}
