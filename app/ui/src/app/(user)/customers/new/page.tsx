"use client";

import { Suspense } from "react";
import { CustomerForm } from "@/components/features/customers";

function NewCustomerContent() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-bold">New Customer</h1>
      <CustomerForm />
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6">Loading...</div>}>
      <NewCustomerContent />
    </Suspense>
  );
}
