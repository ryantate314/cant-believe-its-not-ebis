"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkOrder, WorkOrderStatus } from "@/types";
import { workOrdersApi } from "@/lib/api";

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

interface WorkOrderHeaderProps {
  workOrder: WorkOrder;
  onStatusChange?: (status: WorkOrderStatus) => void;
}

export function WorkOrderHeader({
  workOrder,
  onStatusChange,
}: WorkOrderHeaderProps) {
  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    try {
      await workOrdersApi.update(workOrder.id, {
        status: newStatus,
        updated_by: "system",
      });
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href={`/workorder?city=${workOrder.city.id}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {workOrder.city.code}
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{workOrder.work_order_number}</h1>
            <Badge variant="outline" className={STATUS_COLORS[workOrder.status]}>
              {STATUS_LABELS[workOrder.status]}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
            {workOrder.customer_name && (
              <span>Customer: {workOrder.customer_name}</span>
            )}
            <span>Aircraft: {workOrder.aircraft.registration_number}</span>
            <span>Items: {workOrder.item_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={workOrder.status}
            onValueChange={(v) => handleStatusChange(v as WorkOrderStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
