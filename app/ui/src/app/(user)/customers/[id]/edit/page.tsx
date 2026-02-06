"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CustomerForm } from "@/components/features/customers";
import { Skeleton } from "@/components/ui/skeleton";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customersApi
      .get(customerId)
      .then(setCustomer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

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

  if (error || !customer) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-bold">
        Edit Customer: {customer.name}
      </h1>
      <CustomerForm customer={customer} />
    </div>
  );
}
