import { Suspense } from "react";
import { ToolDetail } from "@/components/features/tools";
import { Skeleton } from "@/components/ui/skeleton";

interface ToolPageProps {
  params: Promise<{ toolID: string }>;
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolID } = await params;

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
        <ToolDetail toolId={toolID} />
      </Suspense>
    </div>
  );
}
