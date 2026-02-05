"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { SortOrder, SortState } from "@/types";

interface UseSortParamsOptions {
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
}

export function useSortParams(options: UseSortParamsOptions = {}) {
  const { defaultSortBy = null, defaultSortOrder = "desc" } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sortBy = searchParams.get("sort_by") || defaultSortBy;
  const sortOrder = (searchParams.get("sort_order") as SortOrder) || defaultSortOrder;

  const sortState: SortState = {
    sortBy,
    sortOrder,
  };

  const updateSort = useCallback(
    (column: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (sortBy === column) {
        // Toggle direction if clicking the same column
        params.set("sort_order", sortOrder === "asc" ? "desc" : "asc");
      } else {
        // Set new column with default ascending order
        params.set("sort_by", column);
        params.set("sort_order", "asc");
      }

      // Reset page to 1 when sort changes
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, sortBy, sortOrder, router, pathname]
  );

  return {
    sortState,
    updateSort,
    sortBy,
    sortOrder,
  };
}
