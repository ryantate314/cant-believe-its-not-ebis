import { Suspense } from "react";
import { ToolList } from "@/components/features/tools";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolListPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <ToolList />
      </Suspense>
    </div>
  );
}
