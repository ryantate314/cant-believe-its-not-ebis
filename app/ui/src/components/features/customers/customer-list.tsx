"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customersApi } from "@/lib/api";
import { useSortParams } from "@/hooks/use-sort-params";
import type { Customer } from "@/types";

type FetchState = {
  data: Customer[];
  total: number;
  fetchKey: string;
};

export function CustomerList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fetchState, setFetchState] = useState<FetchState>({
    data: [],
    total: 0,
    fetchKey: "",
  });

  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { sortState, updateSort, sortBy, sortOrder } = useSortParams({
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });

  // Create a unique key for the current fetch params
  const currentFetchKey = `${search}-${page}-${sortBy}-${sortOrder}`;

  // Derive loading state: loading if key doesn't match
  const loading = fetchState.fetchKey !== currentFetchKey;
  const customers = fetchState.data;
  const total = fetchState.total;

  useEffect(() => {
    let cancelled = false;

    customersApi
      .list({
        page,
        search: search || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
      })
      .then((data) => {
        if (!cancelled) {
          setFetchState({
            data: data.items,
            total: data.total,
            fetchKey: currentFetchKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchState((prev) => ({
            ...prev,
            fetchKey: currentFetchKey,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [search, page, sortBy, sortOrder, currentFetchKey]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") {
      params.delete("page");
    }
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={() => router.push("/customers/new")}>
          New Customer
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-[300px]"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No customers found
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortable
                    sortKey="name"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Name
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="email"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Email
                  </SortableTableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableTableHead
                    sortable
                    sortKey="created_at"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Created
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email || "-"}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.is_active ? "default" : "secondary"}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {customers.length} of {total} customers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams("page", String(page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={customers.length < 20}
                onClick={() => updateParams("page", String(page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
