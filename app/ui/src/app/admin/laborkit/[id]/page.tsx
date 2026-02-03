"use client";

import { use } from "react";
import { LaborKitItemList } from "@/components/features/labor-kits";

interface LaborKitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LaborKitDetailPage({ params }: LaborKitDetailPageProps) {
  const { id } = use(params);
  return (
    <div className="container mx-auto py-6">
      <LaborKitItemList kitId={id} />
    </div>
  );
}
