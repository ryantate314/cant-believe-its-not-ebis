"use client";

import { use } from "react";
import { WorkOrderAuditHistory } from "@/components/features/audit";

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default function HistoryPage({ params }: HistoryPageProps) {
  const { id } = use(params);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Change History</h2>
      <WorkOrderAuditHistory workOrderId={id} />
    </div>
  );
}
