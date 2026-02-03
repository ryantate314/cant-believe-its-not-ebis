"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkOrderForm } from "@/components/features/work-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkOrder, mutateWorkOrder } from "@/hooks/use-work-order";

interface ConfigPageProps {
  params: Promise<{ id: string }>;
}

export default function ConfigPage({ params }: ConfigPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { workOrder, isLoading, error } = useWorkOrder(id);

  useEffect(() => {
    if (error) {
      router.push("/workorder");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Work Order Configuration</h2>
      <WorkOrderForm
        cityId={workOrder.city.id}
        workOrder={workOrder}
        onSuccess={(updated) => {
          mutateWorkOrder(id, updated);
        }}
      />
    </div>
  );
}
