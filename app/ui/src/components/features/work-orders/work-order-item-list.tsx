"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workOrderItemsApi, laborKitsApi } from "@/lib/api";
import type { WorkOrderItem, WorkOrderItemStatus, SortState, LaborKit } from "@/types";

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

interface WorkOrderItemListProps {
  workOrderId: string;
}

export function WorkOrderItemList({ workOrderId }: WorkOrderItemListProps) {
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyKitDialogOpen, setApplyKitDialogOpen] = useState(false);
  const [laborKits, setLaborKits] = useState<LaborKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string>("");
  const [applyingKit, setApplyingKit] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkOrderItem | null>(null);
  const [sortState, setSortState] = useState<SortState>({
    sortBy: "item_number",
    sortOrder: "asc",
  });
  const [formData, setFormData] = useState({
    discrepancy: "",
    corrective_action: "",
    notes: "",
    category: "",
    ata_code: "",
    hours_estimate: "",
    department: "",
    status: "open" as WorkOrderItemStatus,
  });

  const fetchItems = useCallback(async () => {
    console.log("Fetching items with sort:", sortState);
    setLoading(true);
    try {
      const data = await workOrderItemsApi.list(workOrderId, {
        sort_by: sortState.sortBy || undefined,
        sort_order: sortState.sortOrder,
      });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [workOrderId, sortState]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      sortBy: column,
      sortOrder:
        prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const resetForm = () => {
    setFormData({
      discrepancy: "",
      corrective_action: "",
      notes: "",
      category: "",
      ata_code: "",
      hours_estimate: "",
      department: "",
      status: "open",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: WorkOrderItem) => {
    setEditingItem(item);
    setFormData({
      discrepancy: item.discrepancy || "",
      corrective_action: item.corrective_action || "",
      notes: item.notes || "",
      category: item.category || "",
      ata_code: item.ata_code || "",
      hours_estimate: item.hours_estimate?.toString() || "",
      department: item.department || "",
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      hours_estimate: formData.hours_estimate
        ? parseFloat(formData.hours_estimate)
        : undefined,
    };

    try {
      if (editingItem) {
        await workOrderItemsApi.update(workOrderId, editingItem.id, {
          ...data,
          updated_by: "system",
        });
      } else {
        await workOrderItemsApi.create(workOrderId, {
          ...data,
          created_by: "system",
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Failed to save item:", error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await workOrderItemsApi.delete(workOrderId, itemId);
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const openApplyKitDialog = async () => {
    try {
      const data = await laborKitsApi.list({ active_only: true });
      setLaborKits(data.items);
      setSelectedKitId("");
      setApplyKitDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch labor kits:", error);
    }
  };

  const handleApplyKit = async () => {
    if (!selectedKitId) return;

    setApplyingKit(true);
    try {
      const result = await laborKitsApi.apply(selectedKitId, workOrderId, "system");
      setApplyKitDialogOpen(false);
      setSelectedKitId("");
      fetchItems();
      alert(`Successfully added ${result.items_created} items from the labor kit.`);
    } catch (error) {
      console.error("Failed to apply labor kit:", error);
      alert("Failed to apply labor kit. Please try again.");
    } finally {
      setApplyingKit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Work Order Items</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openApplyKitDialog}>
            Apply Labor Kit
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>Add Item</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: v as WorkOrderItemStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ata_code">ATA Code</Label>
                  <Input
                    id="ata_code"
                    value={formData.ata_code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ata_code: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_estimate">Hours Estimate</Label>
                  <Input
                    id="hours_estimate"
                    type="number"
                    step="0.25"
                    value={formData.hours_estimate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hours_estimate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discrepancy">Discrepancy</Label>
                <Textarea
                  id="discrepancy"
                  value={formData.discrepancy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discrepancy: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corrective_action">Corrective Action</Label>
                <Textarea
                  id="corrective_action"
                  value={formData.corrective_action}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      corrective_action: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        {/* Apply Labor Kit Dialog */}
        <Dialog open={applyKitDialogOpen} onOpenChange={setApplyKitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply Labor Kit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a labor kit to apply its template items to this work order.
              </p>
              <div className="space-y-2">
                <Label htmlFor="labor-kit">Labor Kit</Label>
                <Select
                  value={selectedKitId}
                  onValueChange={setSelectedKitId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a labor kit" />
                  </SelectTrigger>
                  <SelectContent>
                    {laborKits.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No labor kits available
                      </SelectItem>
                    ) : (
                      laborKits.map((kit) => (
                        <SelectItem key={kit.id} value={kit.id}>
                          {kit.name}
                          {kit.category && ` (${kit.category})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setApplyKitDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyKit}
                  disabled={!selectedKitId || applyingKit}
                >
                  {applyingKit ? "Applying..." : "Apply Kit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No items yet. Click &quot;Add Item&quot; to create one.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  className="w-16"
                  sortable
                  sortKey="item_number"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  #
                </SortableTableHead>
                <TableHead>Discrepancy</TableHead>
                <SortableTableHead
                  sortable
                  sortKey="category"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Category
                </SortableTableHead>
                <SortableTableHead
                  sortable
                  sortKey="status"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Status
                </SortableTableHead>
                <SortableTableHead
                  sortable
                  sortKey="hours_estimate"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Hours
                </SortableTableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.item_number}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.discrepancy || "-"}
                  </TableCell>
                  <TableCell>{item.category || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[item.status]}
                    >
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.hours_estimate || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
