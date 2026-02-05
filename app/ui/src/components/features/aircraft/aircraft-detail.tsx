"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { aircraftApi } from "@/lib/api";
import type { Aircraft } from "@/types";

interface AircraftDetailProps {
  aircraftId: string;
}

export function AircraftDetail({ aircraftId }: AircraftDetailProps) {
  const router = useRouter();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    aircraftApi
      .get(aircraftId)
      .then(setAircraft)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [aircraftId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await aircraftApi.delete(aircraftId);
      router.push("/aircraft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {error || "Aircraft not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{aircraft.registration_number}</h1>
          <Badge variant={aircraft.is_active ? "default" : "secondary"}>
            {aircraft.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/aircraft/${aircraftId}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete ${aircraft.registration_number}? This action cannot be undone.`
                )
              ) {
                handleDelete();
              }
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Registration Number
              </dt>
              <dd className="mt-1">{aircraft.registration_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Serial Number
              </dt>
              <dd className="mt-1">{aircraft.serial_number || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Make</dt>
              <dd className="mt-1">{aircraft.make || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Model</dt>
              <dd className="mt-1">{aircraft.model || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Year Built
              </dt>
              <dd className="mt-1">{aircraft.year_built || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Aircraft Class
              </dt>
              <dd className="mt-1">{aircraft.aircraft_class || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Fuel Code
              </dt>
              <dd className="mt-1">{aircraft.fuel_code || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Primary City
              </dt>
              <dd className="mt-1">
                {aircraft.primary_city
                  ? `${aircraft.primary_city.code} - ${aircraft.primary_city.name}`
                  : "-"}
              </dd>
            </div>
            {aircraft.meter_profile && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  Meter Profile
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {aircraft.meter_profile}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Customer Name
              </dt>
              <dd className="mt-1">{aircraft.customer_name || "-"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {aircraft.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{aircraft.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created By
              </dt>
              <dd className="mt-1">{aircraft.created_by}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created At
              </dt>
              <dd className="mt-1">
                {new Date(aircraft.created_at).toLocaleString()}
              </dd>
            </div>
            {aircraft.updated_by && (
              <>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated By
                  </dt>
                  <dd className="mt-1">{aircraft.updated_by}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </dt>
                  <dd className="mt-1">
                    {new Date(aircraft.updated_at).toLocaleString()}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
