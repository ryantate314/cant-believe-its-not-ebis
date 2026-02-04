"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workOrderItemsApi } from "@/lib/api";
import { useWorkOrderItem, mutateWorkOrderItem } from "@/hooks/use-work-order-item";
import type { WorkOrderItem, WorkOrderItemStatus, WorkOrderItemUpdateInput } from "@/types";

const STATUS_COLORS: Record<WorkOrderItemStatus, string> = {
  open: "bg-green-100 text-green-800",
  waiting_for_parts: "bg-orange-100 text-orange-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  tech_review: "bg-blue-100 text-blue-800",
  admin_review: "bg-purple-100 text-purple-800",
  finished: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<WorkOrderItemStatus, string> = {
  open: "Open",
  waiting_for_parts: "Waiting for Parts",
  in_progress: "In Progress",
  tech_review: "Tech Review",
  admin_review: "Admin Review",
  finished: "Finished",
};

interface WorkOrderItemDetailProps {
  workOrderId: string;
  itemId: string;
}

interface FormData {
  discrepancy: string;
  corrective_action: string;
  notes: string;
  category: string;
  sub_category: string;
  ata_code: string;
  hours_estimate: string;
  billing_method: string;
  flat_rate: string;
  department: string;
  do_not_bill: boolean;
  enable_rii: boolean;
  status: WorkOrderItemStatus;
}

function itemToFormData(item: WorkOrderItem): FormData {
  return {
    discrepancy: item.discrepancy || "",
    corrective_action: item.corrective_action || "",
    notes: item.notes || "",
    category: item.category || "",
    sub_category: item.sub_category || "",
    ata_code: item.ata_code || "",
    hours_estimate: item.hours_estimate?.toString() || "",
    billing_method: item.billing_method || "hourly",
    flat_rate: item.flat_rate?.toString() || "",
    department: item.department || "",
    do_not_bill: item.do_not_bill || false,
    enable_rii: item.enable_rii || false,
    status: item.status,
  };
}

function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-base">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {title}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function WorkOrderItemDetail({
  workOrderId,
  itemId,
}: WorkOrderItemDetailProps) {
  const router = useRouter();
  const { item, isLoading, error } = useWorkOrderItem(workOrderId, itemId);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form data when item loads
  useEffect(() => {
    if (item && !formData) {
      const data = itemToFormData(item);
      setFormData(data);
      setOriginalFormData(data);
    }
  }, [item, formData]);

  // Check if form is dirty
  const isDirty =
    formData &&
    originalFormData &&
    JSON.stringify(formData) !== JSON.stringify(originalFormData);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    []
  );

  const handleStatusChange = async (newStatus: WorkOrderItemStatus) => {
    if (!item) return;

    // Optimistic update
    updateField("status", newStatus);

    try {
      const updated = await workOrderItemsApi.update(workOrderId, itemId, {
        status: newStatus,
        updated_by: "system",
      });
      mutateWorkOrderItem(workOrderId, itemId, updated);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      // Revert on error
      updateField("status", item.status);
      toast.error("Failed to update status");
      console.error("Status update failed:", err);
    }
  };

  const handleSave = async () => {
    if (!formData || !item) return;

    setIsSaving(true);
    try {
      const updateData: WorkOrderItemUpdateInput = {
        discrepancy: formData.discrepancy || undefined,
        corrective_action: formData.corrective_action || undefined,
        notes: formData.notes || undefined,
        category: formData.category || undefined,
        sub_category: formData.sub_category || undefined,
        ata_code: formData.ata_code || undefined,
        hours_estimate: formData.hours_estimate
          ? parseFloat(formData.hours_estimate)
          : undefined,
        billing_method: formData.billing_method || undefined,
        flat_rate: formData.flat_rate
          ? parseFloat(formData.flat_rate)
          : undefined,
        department: formData.department || undefined,
        do_not_bill: formData.do_not_bill,
        enable_rii: formData.enable_rii,
        status: formData.status,
        updated_by: "system",
      };

      const updated = await workOrderItemsApi.update(
        workOrderId,
        itemId,
        updateData
      );
      mutateWorkOrderItem(workOrderId, itemId, updated);
      setOriginalFormData(formData);
      toast.success("Changes saved successfully");
    } catch (err) {
      toast.error("Failed to save changes");
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    router.push(`/workorder/${workOrderId}/item`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await workOrderItemsApi.delete(workOrderId, itemId);
      toast.success("Item deleted successfully");
      router.push(`/workorder/${workOrderId}/item`);
    } catch (err) {
      toast.error("Failed to delete item");
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Item not found or failed to load.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/workorder/${workOrderId}/item`)}
        >
          Back to Items
        </Button>
      </div>
    );
  }

  if (!formData) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/workorder/${workOrderId}/item`}
          className="hover:text-foreground hover:underline"
        >
          Items
        </Link>
        <span>/</span>
        <span className="text-foreground">Item #{item.item_number}</span>
      </nav>

      {/* Header with Status and Delete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Item #{item.item_number}</h2>
          <Badge variant="outline" className={STATUS_COLORS[formData.status]}>
            {STATUS_LABELS[formData.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={formData.status}
            onValueChange={(v) => handleStatusChange(v as WorkOrderItemStatus)}
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
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Defect Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defect Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discrepancy">Discrepancy</Label>
            <Textarea
              id="discrepancy"
              value={formData.discrepancy}
              onChange={(e) => updateField("discrepancy", e.target.value)}
              rows={3}
              placeholder="Describe the issue or discrepancy..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="corrective_action">Corrective Action</Label>
            <Textarea
              id="corrective_action"
              value={formData.corrective_action}
              onChange={(e) => updateField("corrective_action", e.target.value)}
              rows={3}
              placeholder="Describe the corrective action taken..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-column grid for Classification and Time & Billing */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Classification */}
        <CollapsibleCard title="Work Classification" defaultOpen={true}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="e.g., Inspection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_category">Sub-Category</Label>
              <Input
                id="sub_category"
                value={formData.sub_category}
                onChange={(e) => updateField("sub_category", e.target.value)}
                placeholder="e.g., Exterior"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ata_code">ATA Code</Label>
              <Input
                id="ata_code"
                value={formData.ata_code}
                onChange={(e) => updateField("ata_code", e.target.value)}
                placeholder="e.g., 71-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="e.g., Maintenance"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Time & Billing */}
        <CollapsibleCard title="Time & Billing" defaultOpen={true}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hours_estimate">Hours Estimate</Label>
                <Input
                  id="hours_estimate"
                  type="number"
                  step="0.25"
                  value={formData.hours_estimate}
                  onChange={(e) => updateField("hours_estimate", e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_method">Billing Method</Label>
                <Select
                  value={formData.billing_method}
                  onValueChange={(v) => updateField("billing_method", v)}
                >
                  <SelectTrigger id="billing_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="flat_rate">Flat Rate</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.billing_method === "flat_rate" && (
              <div className="space-y-2">
                <Label htmlFor="flat_rate">Flat Rate Amount</Label>
                <Input
                  id="flat_rate"
                  type="number"
                  step="0.01"
                  value={formData.flat_rate}
                  onChange={(e) => updateField("flat_rate", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="do_not_bill"
                  checked={formData.do_not_bill}
                  onCheckedChange={(checked) =>
                    updateField("do_not_bill", checked)
                  }
                />
                <Label htmlFor="do_not_bill" className="cursor-pointer">
                  Do Not Bill
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="enable_rii"
                  checked={formData.enable_rii}
                  onCheckedChange={(checked) =>
                    updateField("enable_rii", checked)
                  }
                />
                <Label htmlFor="enable_rii" className="cursor-pointer">
                  Enable RII
                </Label>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      {/* Parts & Tools placeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CollapsibleCard title="Parts" defaultOpen={false}>
          <p className="text-sm text-muted-foreground">
            Parts tracking coming soon.
          </p>
        </CollapsibleCard>
        <CollapsibleCard title="Tools" defaultOpen={false}>
          <p className="text-sm text-muted-foreground">
            Tools tracking coming soon.
          </p>
        </CollapsibleCard>
      </div>

      {/* Notes - only show if there's content or user wants to add */}
      <CollapsibleCard
        title="Notes"
        defaultOpen={Boolean(formData.notes || item.notes)}
      >
        <div className="space-y-2">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            placeholder="Additional notes..."
          />
        </div>
      </CollapsibleCard>

      {/* Audit Trail */}
      <CollapsibleCard title="Audit Trail" defaultOpen={false}>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <span className="font-medium">Created By:</span>{" "}
            <span className="text-muted-foreground">{item.created_by}</span>
          </div>
          <div>
            <span className="font-medium">Created At:</span>{" "}
            <span className="text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
          {item.updated_by && (
            <>
              <div>
                <span className="font-medium">Updated By:</span>{" "}
                <span className="text-muted-foreground">{item.updated_by}</span>
              </div>
              <div>
                <span className="font-medium">Updated At:</span>{" "}
                <span className="text-muted-foreground">
                  {new Date(item.updated_at).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>

      {/* Save/Cancel Footer */}
      <div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Item #{item.item_number}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
