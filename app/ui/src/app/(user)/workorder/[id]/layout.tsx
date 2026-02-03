"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkOrderHeader, WorkOrderSidebar } from "@/components/features/work-orders";
import type { WorkOrderStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkOrder, mutateWorkOrder } from "@/hooks/use-work-order";

interface WorkOrderLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function WorkOrderLayout({
  children,
  params,
}: WorkOrderLayoutProps) {
  const { id } = use(params);
  const router = useRouter();
  const { workOrder, isLoading, error } = useWorkOrder(id);

  useEffect(() => {
    if (error) {
      router.push("/workorder");
    }
  }, [error, router]);

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    if (workOrder) {
      mutateWorkOrder(id, { ...workOrder, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="border-b bg-white px-6 py-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="flex flex-1">
          <div className="w-48 border-r p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <WorkOrderHeader workOrder={workOrder} onStatusChange={handleStatusChange} />
      <div className="flex flex-1">
        <WorkOrderSidebar workOrderId={id} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
