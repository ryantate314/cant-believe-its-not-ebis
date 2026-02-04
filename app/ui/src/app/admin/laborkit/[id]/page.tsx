"use client";

import { use } from "react";
import { LaborKitDetail } from "@/components/features/labor-kits";

interface LaborKitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LaborKitDetailPage({ params }: LaborKitDetailPageProps) {
  const { id } = use(params);
  return (
    <div className="container mx-auto py-6">
      <LaborKitDetail kitId={id} />
    </div>
  );
}
