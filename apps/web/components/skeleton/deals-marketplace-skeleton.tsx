import { Skeleton } from "@/components/ui/skeleton";

export function DealsMarketplaceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[140px]" />
        </div>
        <Skeleton className="h-9 w-[88px]" />
      </div>

      {/* Results count skeleton */}
      <Skeleton className="h-5 w-24" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-lg overflow-hidden"
          >
            {/* Cover image */}
            <Skeleton className="h-40 w-full" />
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Title and badges */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              {/* Action button */}
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-2 mt-8">
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

