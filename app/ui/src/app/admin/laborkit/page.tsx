import { Suspense } from "react";
import { LaborKitList } from "@/components/features/labor-kits";
import { Skeleton } from "@/components/ui/skeleton";

export default function LaborKitListPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <LaborKitList />
      </Suspense>
    </div>
  );
}
