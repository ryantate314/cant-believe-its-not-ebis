"use client";

import { useEffect, useState, use } from "react";
import { WorkOrderForm } from "@/components/features/work-orders";
import { workOrdersApi } from "@/lib/api";
import type { WorkOrder } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface ConfigPageProps {
  params: Promise<{ id: string }>;
}

export default function ConfigPage({ params }: ConfigPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workOrdersApi
      .get(id)
      .then(setWorkOrder)
      .catch(() => router.push("/workorder"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
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
          setWorkOrder(updated);
          router.refresh();
        }}
      />
    </div>
  );
}
