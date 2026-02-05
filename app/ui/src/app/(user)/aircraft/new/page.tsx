"use client";

import { Suspense } from "react";
import { AircraftForm } from "@/components/features/aircraft";

function NewAircraftContent() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-bold">New Aircraft</h1>
      <AircraftForm />
    </div>
  );
}

export default function NewAircraftPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6">Loading...</div>}>
      <NewAircraftContent />
    </Suspense>
  );
}
