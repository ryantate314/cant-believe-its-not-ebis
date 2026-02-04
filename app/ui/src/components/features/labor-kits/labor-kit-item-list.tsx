"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import { laborKitsApi, laborKitItemsApi } from "@/lib/api";
import type { LaborKit, LaborKitItem, SortState } from "@/types";

interface LaborKitItemListProps {
  kitId: string;
}

export function LaborKitItemList({ kitId }: LaborKitItemListProps) {
  const [kit, setKit] = useState<LaborKit | null>(null);
  const [items, setItems] = useState<LaborKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LaborKitItem | null>(null);
  const [sortState, setSortState] = useState<SortState>({
    sortBy: "item_number",
    sortOrder: "asc",
  });
  const [formData, setFormData] = useState({
    discrepancy: "",
    corrective_action: "",
    notes: "",
    category: "",
    sub_category: "",
    ata_code: "",
    hours_estimate: "",
    billing_method: "hourly",
    flat_rate: "",
    department: "",
    do_not_bill: false,
    enable_rii: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kitData, itemsData] = await Promise.all([
        laborKitsApi.get(kitId),
        laborKitItemsApi.list(kitId, {
          sort_by: sortState.sortBy || undefined,
          sort_order: sortState.sortOrder,
        }),
      ]);
      setKit(kitData);
      setItems(itemsData.items);
    } finally {
      setLoading(false);
    }
  }, [kitId, sortState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      sub_category: "",
      ata_code: "",
      hours_estimate: "",
      billing_method: "hourly",
      flat_rate: "",
      department: "",
      do_not_bill: false,
      enable_rii: false,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: LaborKitItem) => {
    setEditingItem(item);
    setFormData({
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
      do_not_bill: item.do_not_bill,
      enable_rii: item.enable_rii,
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
      flat_rate: formData.flat_rate
        ? parseFloat(formData.flat_rate)
        : undefined,
    };

    try {
      if (editingItem) {
        await laborKitItemsApi.update(kitId, editingItem.id, {
          ...data,
          updated_by: "system",
        });
      } else {
        await laborKitItemsApi.create(kitId, {
          ...data,
          created_by: "system",
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to save item:", error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await laborKitItemsApi.delete(kitId, itemId);
      fetchData();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  if (loading && !kit) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Labor kit not found.{" "}
        <Link href="/laborkit" className="text-primary underline">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/laborkit">
          <Button variant="ghost" size="sm">
            &larr; Back to list
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{kit.name}</h1>
        {kit.description && (
          <p className="text-muted-foreground">{kit.description}</p>
        )}
        <div className="flex gap-2 text-sm text-muted-foreground">
          {kit.category && <span>Category: {kit.category}</span>}
          <span>|</span>
          <span>{kit.is_active ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Template Items</h2>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="sub_category">Sub Category</Label>
                  <Input
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sub_category: e.target.value,
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

                <div className="space-y-2">
                  <Label htmlFor="billing_method">Billing Method</Label>
                  <Select
                    value={formData.billing_method}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, billing_method: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="flat_rate">Flat Rate</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="flat_rate">Flat Rate ($)</Label>
                  <Input
                    id="flat_rate"
                    type="number"
                    step="0.01"
                    value={formData.flat_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        flat_rate: e.target.value,
                      }))
                    }
                    disabled={formData.billing_method !== "flat_rate"}
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

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="do_not_bill"
                    checked={formData.do_not_bill}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, do_not_bill: checked }))
                    }
                  />
                  <Label htmlFor="do_not_bill">Do Not Bill</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="enable_rii"
                    checked={formData.enable_rii}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, enable_rii: checked }))
                    }
                  />
                  <Label htmlFor="enable_rii">Enable RII</Label>
                </div>
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
                <TableHead>ATA</TableHead>
                <SortableTableHead
                  sortable
                  sortKey="hours_estimate"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Hours
                </SortableTableHead>
                <TableHead>Billing</TableHead>
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
                  <TableCell>{item.ata_code || "-"}</TableCell>
                  <TableCell>{item.hours_estimate || "-"}</TableCell>
                  <TableCell className="capitalize">
                    {item.billing_method.replace("_", " ")}
                  </TableCell>
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
