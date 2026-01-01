import { Skeleton } from "@/components/ui/skeleton";

export function InvestmentTypeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Hero section skeleton */}
      <div className="mb-12">
        <Skeleton className="h-10 w-72 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mb-2" />
        <Skeleton className="h-6 w-full max-w-xl" />
      </div>

      {/* Key Info section skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-lg border">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Content section skeleton */}
      <div className="mb-12">
        <Skeleton className="h-8 w-56 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>

      {/* Related types skeleton */}
      <div>
        <Skeleton className="h-8 w-52 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

