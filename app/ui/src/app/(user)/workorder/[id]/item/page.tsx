"use client";

import { use } from "react";
import { WorkOrderItemList } from "@/components/features/work-orders";

interface ItemsPageProps {
  params: Promise<{ id: string }>;
}

export default function ItemsPage({ params }: ItemsPageProps) {
  const { id } = use(params);
  return <WorkOrderItemList workOrderId={id} />;
}
