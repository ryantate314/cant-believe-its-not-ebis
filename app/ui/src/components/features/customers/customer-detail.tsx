"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";

interface CustomerDetailProps {
  customerId: string;
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    customersApi
      .get(customerId)
      .then(setCustomer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customersApi.delete(customerId);
      router.push("/customers");
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

  if (error || !customer) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {error || "Customer not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <Badge variant={customer.is_active ? "default" : "secondary"}>
            {customer.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/customers/${customerId}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete ${customer.name}? This action cannot be undone.`
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
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1">{customer.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1">{customer.email || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Phone
              </dt>
              <dd className="mt-1">{customer.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Phone Type
              </dt>
              <dd className="mt-1">{customer.phone_type || "-"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Address
              </dt>
              <dd className="mt-1">{customer.address || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Address 2
              </dt>
              <dd className="mt-1">{customer.address_2 || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                City
              </dt>
              <dd className="mt-1">{customer.city || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                State
              </dt>
              <dd className="mt-1">{customer.state || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Zip
              </dt>
              <dd className="mt-1">{customer.zip || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Country
              </dt>
              <dd className="mt-1">{customer.country || "-"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{customer.notes}</p>
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
              <dd className="mt-1">{customer.created_by}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created At
              </dt>
              <dd className="mt-1">
                {new Date(customer.created_at).toLocaleString()}
              </dd>
            </div>
            {customer.updated_by && (
              <>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated By
                  </dt>
                  <dd className="mt-1">{customer.updated_by}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </dt>
                  <dd className="mt-1">
                    {new Date(customer.updated_at).toLocaleString()}
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
