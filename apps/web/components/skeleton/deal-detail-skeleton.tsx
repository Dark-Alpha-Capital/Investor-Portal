import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export function DealDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action Buttons Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="overview" className="space-y-6 mt-6">
        {/* Tab List Skeleton - matches TabCounts component structure */}
        <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] gap-1">
          <Skeleton className="h-[calc(100%-1px)] w-[100px] rounded-md" />
          <Skeleton className="h-[calc(100%-1px)] w-[120px] rounded-md" />
          <Skeleton className="h-[calc(100%-1px)] w-[100px] rounded-md" />
          <Skeleton className="h-[calc(100%-1px)] w-[120px] rounded-md" />
          <Skeleton className="h-[calc(100%-1px)] w-[130px] rounded-md" />
          <Skeleton className="h-[calc(100%-1px)] w-[100px] rounded-md" />
        </div>

        {/* Tab Content Skeleton */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-3">
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>

            {/* Grid Layout Skeleton - Deal Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-3 p-4 border rounded-lg bg-card"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
              ))}
            </div>

            {/* Additional Content Sections */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-[200px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

