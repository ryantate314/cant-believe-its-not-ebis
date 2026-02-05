"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortState } from "@/types";

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortKey?: string;
  sortState?: SortState;
  onSort?: (column: string) => void;
}

function SortIcon({
  sortable,
  isActive,
  sortOrder,
}: {
  sortable: boolean;
  isActive: boolean;
  sortOrder?: "asc" | "desc";
}) {
  if (!sortable) return null;

  if (isActive) {
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  }

  return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
}

function SortableTableHead({
  className,
  children,
  sortable = false,
  sortKey,
  sortState,
  onSort,
  ...props
}: SortableTableHeadProps) {
  const isActive = sortable && sortState?.sortBy === sortKey;

  const handleClick = () => {
    if (sortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        sortable && "cursor-pointer select-none hover:bg-muted/50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center">
        {children}
        <SortIcon sortable={sortable} isActive={isActive} sortOrder={sortState?.sortOrder} />
      </div>
    </th>
  );
}

export { SortableTableHead };
export type { SortableTableHeadProps };
