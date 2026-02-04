"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { laborKitsApi } from "@/lib/api";
import type { LaborKit, SortState } from "@/types";
import { LABOR_KIT_CATEGORIES } from "@/types/labor-kit";

export function LaborKitList() {
  const router = useRouter();
  const [kits, setKits] = useState<LaborKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [sortState, setSortState] = useState<SortState>({
    sortBy: "name",
    sortOrder: "asc",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    is_active: true,
  });

  const fetchKits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await laborKitsApi.list({
        sort_by: sortState.sortBy || undefined,
        sort_order: sortState.sortOrder,
        active_only: !showInactive,
      });
      setKits(data.items);
    } finally {
      setLoading(false);
    }
  }, [sortState, showInactive]);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      sortBy: column,
      sortOrder:
        prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newKit = await laborKitsApi.create({
        ...formData,
        created_by: "system",
      });
      setDialogOpen(false);
      resetForm();
      router.push(`/admin/laborkit/${newKit.id}`);
    } catch (error) {
      console.error("Failed to save labor kit:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Labor Kits</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>New Labor Kit</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Labor Kit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABOR_KIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <Label htmlFor="show-inactive">Show inactive kits</Label>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No labor kits found. Click &quot;New Labor Kit&quot; to create one.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortable
                  sortKey="name"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Name
                </SortableTableHead>
                <SortableTableHead
                  sortable
                  sortKey="category"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Category
                </SortableTableHead>
                <TableHead>Description</TableHead>
                <SortableTableHead
                  sortable
                  sortKey="is_active"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Status
                </SortableTableHead>
                <SortableTableHead
                  sortable
                  sortKey="created_at"
                  sortState={sortState}
                  onSort={handleSort}
                >
                  Created
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kits.map((kit) => (
                <TableRow
                  key={kit.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/laborkit/${kit.id}`)}
                >
                  <TableCell className="font-medium">{kit.name}</TableCell>
                  <TableCell>{kit.category || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {kit.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        kit.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {kit.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(kit.created_at).toLocaleDateString()}
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
