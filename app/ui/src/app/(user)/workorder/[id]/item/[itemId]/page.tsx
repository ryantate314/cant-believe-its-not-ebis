"use client";

import { use } from "react";
import { WorkOrderItemDetail } from "@/components/features/work-orders";

interface ItemDetailPageProps {
  params: Promise<{ id: string; itemId: string }>;
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id, itemId } = use(params);
  return <WorkOrderItemDetail workOrderId={id} itemId={itemId} />;
}
