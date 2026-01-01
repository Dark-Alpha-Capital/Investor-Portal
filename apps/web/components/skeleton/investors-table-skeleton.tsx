import { Skeleton } from "@/components/ui/skeleton";

export function InvestorsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Bar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <Skeleton className="h-10 w-full sm:w-[200px]" />
          {/* KYC Status Filter */}
          <Skeleton className="h-10 w-[160px]" />
          {/* Verified Filter */}
          <Skeleton className="h-10 w-[140px]" />
        </div>
        {/* View Toggle */}
        <Skeleton className="h-10 w-[80px]" />
      </div>

      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-[150px]" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 border-b">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px] ml-auto" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-b last:border-b-0"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-6 w-[60px] rounded-full" />
            <Skeleton className="h-6 w-[100px] rounded-full" />
            <Skeleton className="h-4 w-[70px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-8 w-[70px] ml-auto" />
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-9 w-[90px]" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9" />
          ))}
        </div>
        <Skeleton className="h-9 w-[70px]" />
      </div>
    </div>
  );
}

