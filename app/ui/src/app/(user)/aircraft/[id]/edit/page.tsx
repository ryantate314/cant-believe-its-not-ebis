"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AircraftForm } from "@/components/features/aircraft";
import { Skeleton } from "@/components/ui/skeleton";
import { aircraftApi } from "@/lib/api";
import type { Aircraft } from "@/types";

export default function EditAircraftPage() {
  const params = useParams();
  const aircraftId = params.id as string;
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    aircraftApi
      .get(aircraftId)
      .then(setAircraft)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [aircraftId]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {error || "Aircraft not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-bold">
        Edit Aircraft: {aircraft.registration_number}
      </h1>
      <AircraftForm aircraft={aircraft} />
    </div>
  );
}
