import { Suspense } from "react";
import { AircraftDetail } from "@/components/features/aircraft";
import { Skeleton } from "@/components/ui/skeleton";

interface AircraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function AircraftPage({ params }: AircraftPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <AircraftDetail aircraftId={id} />
      </Suspense>
    </div>
  );
}
