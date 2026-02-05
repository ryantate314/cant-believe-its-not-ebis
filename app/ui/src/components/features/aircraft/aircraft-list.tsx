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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { aircraftApi, citiesApi } from "@/lib/api";
import { useSortParams } from "@/hooks/use-sort-params";
import type { Aircraft, City } from "@/types";

type FetchState = {
  data: Aircraft[];
  total: number;
  fetchKey: string;
};

export function AircraftList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({
    data: [],
    total: 0,
    fetchKey: "",
  });

  const cityId = searchParams.get("city") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { sortState, updateSort, sortBy, sortOrder } = useSortParams({
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
  });

  // Create a unique key for the current fetch params
  const currentFetchKey = `${cityId}-${search}-${page}-${sortBy}-${sortOrder}`;

  // Derive loading state: loading if key doesn't match
  const loading = fetchState.fetchKey !== currentFetchKey;
  const aircraft = fetchState.data;
  const total = fetchState.total;

  useEffect(() => {
    citiesApi.list().then((data) => setCities(data.items));
  }, []);

  useEffect(() => {
    let cancelled = false;

    aircraftApi
      .list({
        page,
        search: search || undefined,
        city_id: cityId || undefined,
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
  }, [cityId, search, page, sortBy, sortOrder, currentFetchKey]);

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
    router.push(`/aircraft?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aircraft</h1>
        <Button onClick={() => router.push("/aircraft/new")}>
          New Aircraft
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={cityId || "all"}
          onValueChange={(v) => updateParams("city", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
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
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : aircraft.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No aircraft found
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortable
                    sortKey="registration_number"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Registration
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="make"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Make
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="model"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Model
                  </SortableTableHead>
                  <SortableTableHead
                    sortable
                    sortKey="year_built"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Year
                  </SortableTableHead>
                  <TableHead>Serial</TableHead>
                  <SortableTableHead
                    sortable
                    sortKey="customer_name"
                    sortState={sortState}
                    onSort={updateSort}
                  >
                    Customer
                  </SortableTableHead>
                  <TableHead>City</TableHead>
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
                {aircraft.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/aircraft/${a.id}`)}
                  >
                    <TableCell className="font-medium">
                      {a.registration_number}
                    </TableCell>
                    <TableCell>{a.make || "-"}</TableCell>
                    <TableCell>{a.model || "-"}</TableCell>
                    <TableCell>{a.year_built || "-"}</TableCell>
                    <TableCell>{a.serial_number || "-"}</TableCell>
                    <TableCell>{a.customer_name || "-"}</TableCell>
                    <TableCell>
                      {a.primary_city ? a.primary_city.code : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(a.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {aircraft.length} of {total} aircraft
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
                disabled={aircraft.length < 20}
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
