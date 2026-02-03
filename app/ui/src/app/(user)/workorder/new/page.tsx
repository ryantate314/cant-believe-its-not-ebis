"use client";

import { useSearchParams } from "next/navigation";
import { WorkOrderForm } from "@/components/features/work-orders";
import { Suspense } from "react";

function NewWorkOrderContent() {
  const searchParams = useSearchParams();
  const cityId = searchParams.get("city");

  if (!cityId) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          City ID is required. Please select a city first.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-bold">New Work Order</h1>
      <WorkOrderForm cityId={cityId} />
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6">Loading...</div>}>
      <NewWorkOrderContent />
    </Suspense>
  );
}
