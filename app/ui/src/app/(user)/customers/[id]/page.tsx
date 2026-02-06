import { Suspense } from "react";
import { CustomerDetail } from "@/components/features/customers";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
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
        <CustomerDetail customerId={id} />
      </Suspense>
    </div>
  );
}
