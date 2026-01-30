"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { workOrdersApi, citiesApi } from "@/lib/api";
import { useSortParams } from "@/hooks/use-sort-params";
import type {
  WorkOrder,
  WorkOrderStatus,
  City,
  WORK_ORDER_STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/types";

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  created: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  open: "bg-green-100 text-green-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  tracking: "bg-purple-100 text-purple-800",
  pending: "bg-orange-100 text-orange-800",
  in_review: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  void: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  created: "Created",
  scheduled: "Scheduled",
  open: "Open",
  in_progress: "In Progress",
  tracking: "Tracking",
  pending: "Pending",
  in_review: "In Review",
  completed: "Completed",
  void: "Void",
};

export function WorkOrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const cityId = searchParams.get("city") || "";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { sortState, updateSort, sortBy, sortOrder } = useSortParams({
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
  });

  useEffect(() => {
    citiesApi.list().then((data) => setCities(data.items));
  }, []);

  useEffect(() => {
    if (!cityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    workOrdersApi
      .list({
        city_id: cityId,
        page,
        search: search || undefined,
        status: status || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
      })
      .then((data) => {
        setWorkOrders(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [cityId, search, status, page, sortBy, sortOrder]);

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
    router.push(`/workorder?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        {cityId && (
          <Link href={`/workorder/new?city=${cityId}`}>
            <Button>New Work Order</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4">
        <Select value={cityId} onValueChange={(v) => updateParams("city", v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.code} - {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className="w-[300px]"
        />

        <Select
          value={status || "all"}
          onValueChange={(v) => updateParams("status", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!cityId ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Please select a city to view work orders
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : workOrders.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No work orders found
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortable
                    sortKey="work_order_number"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    WO #
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="customer_name"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Customer
                  </SortableTableHead>
                  <TableHead>Aircraft</TableHead>
                  <SortableTableHead
                    sortable
                    sortKey="status"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="priority"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Priority
                  </SortableTableHead>
                  <TableHead>Items</TableHead>
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
                {workOrders.map((wo) => (
                  <TableRow
                    key={wo.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/workorder/${wo.id}`)}
                  >
                    <TableCell className="font-medium">
                      {wo.work_order_number}
                    </TableCell>
                    <TableCell>{wo.customer_name || "-"}</TableCell>
                    <TableCell>{wo.aircraft_registration || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[wo.status]}
                      >
                        {STATUS_LABELS[wo.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{wo.priority}</TableCell>
                    <TableCell>{wo.item_count}</TableCell>
                    <TableCell>
                      {new Date(wo.created_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {workOrders.length} of {total} work orders
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
                disabled={workOrders.length < 20}
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
