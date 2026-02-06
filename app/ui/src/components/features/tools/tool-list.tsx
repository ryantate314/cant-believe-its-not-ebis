"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { toolsApi, toolRoomsApi, citiesApi } from "@/lib/api";
import { useSortParams } from "@/hooks/use-sort-params";
import type { Tool, ToolRoom, ToolType, KitFilter, CalibDueDays } from "@/types/tool";
import type { City } from "@/types/work-order";

const TOOL_TYPE_COLORS: Record<string, string> = {
  certified: "bg-blue-100 text-blue-800",
  reference: "bg-purple-100 text-purple-800",
  consumable: "bg-gray-100 text-gray-800",
  kit: "bg-green-100 text-green-800",
};

type FetchState = {
  data: Tool[];
  total: number;
  fetchKey: string;
};

function CalibrationDueCell({ days }: { days: number | null }) {
  if (days === null) return <span>-</span>;

  let colorClass = "text-foreground";
  if (days < 0) {
    colorClass = "text-red-600 font-semibold";
  } else if (days <= 30) {
    colorClass = "text-orange-600 font-semibold";
  } else if (days <= 60) {
    colorClass = "text-yellow-600 font-semibold";
  }

  return <span className={colorClass}>{days}d</span>;
}

export function ToolList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [toolRooms, setToolRooms] = useState<ToolRoom[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({
    data: [],
    total: 0,
    fetchKey: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    tool_type: "" as ToolType | "",
    tool_room_id: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      tool_type: "",
      tool_room_id: "",
      description: "",
    });
  };

  const cityId = searchParams.get("city") || "";
  const toolRoomId = searchParams.get("tool_room") || "";
  const kitFilter = (searchParams.get("kit_filter") as KitFilter) || "";
  const calibDue = searchParams.get("calib_due") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "25", 10);
  const { sortState, updateSort, sortBy, sortOrder } = useSortParams({
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });

  const currentFetchKey = cityId
    ? `${cityId}-${toolRoomId}-${kitFilter}-${calibDue}-${page}-${pageSize}-${sortBy}-${sortOrder}-${refetchCounter}`
    : "";

  const loading = cityId ? fetchState.fetchKey !== currentFetchKey : false;
  const tools = fetchState.data;
  const total = fetchState.total;

  // Load cities on mount
  useEffect(() => {
    citiesApi.list().then((data) => setCities(data.items));
  }, []);

  // Load tool rooms when city changes
  useEffect(() => {
    if (!cityId) {
      setToolRooms([]);
      return;
    }
    toolRoomsApi
      .list({ city_id: cityId })
      .then((data) => setToolRooms(data.items));
  }, [cityId]);

  // Load tools
  useEffect(() => {
    if (!cityId) {
      return;
    }

    let cancelled = false;

    toolsApi
      .list({
        city_id: cityId,
        tool_room_id: toolRoomId || undefined,
        page,
        page_size: pageSize as 25 | 50 | 100,
        kit_filter: (kitFilter as KitFilter) || undefined,
        calib_due_days: calibDue ? (Number(calibDue) as CalibDueDays) : undefined,
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
  }, [cityId, toolRoomId, kitFilter, calibDue, page, pageSize, sortBy, sortOrder, currentFetchKey]);

  const handleAddTool = async (navigateToDetail: boolean) => {
    if (!formData.name || !formData.tool_type || !formData.tool_room_id) return;
    try {
      const newTool = await toolsApi.create({
        name: formData.name,
        tool_type: formData.tool_type as ToolType,
        tool_room_id: formData.tool_room_id,
        description: formData.description || undefined,
        created_by: "system",
      });
      setDialogOpen(false);
      resetForm();
      if (navigateToDetail) {
        router.push(`/tool/${newTool.id}`);
      } else {
        setRefetchCounter((c) => c + 1);
      }
    } catch (error) {
      console.error("Failed to create tool:", error);
    }
  };

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page when filters change
    if (key !== "page") {
      params.delete("page");
    }
    // Clear tool room when city changes
    if (key === "city") {
      params.delete("tool_room");
    }
    router.push(`/tool?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tools</h1>
          <div className="flex items-center gap-3">
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>Add Tool</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Tool</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tool-name">Tool Name *</Label>
                    <Input
                      id="tool-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tool-type">Tool Type *</Label>
                    <Select
                      value={formData.tool_type}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, tool_type: v as ToolType }))
                      }
                    >
                      <SelectTrigger id="tool-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="certified">Certified</SelectItem>
                        <SelectItem value="consumable">Consumable</SelectItem>
                        <SelectItem value="kit">Kit</SelectItem>
                        <SelectItem value="reference">Reference Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tool-room">Tool Room *</Label>
                    <Select
                      value={formData.tool_room_id}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, tool_room_id: v }))
                      }
                      disabled={toolRooms.length === 0}
                    >
                      <SelectTrigger id="tool-room">
                        <SelectValue
                          placeholder={
                            toolRooms.length === 0
                              ? "Select a city first"
                              : "Select tool room"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {toolRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.code} - {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tool-description">Description</Label>
                    <Textarea
                      id="tool-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      maxLength={255}
                      rows={3}
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!formData.name || !formData.tool_type || !formData.tool_room_id}
                      onClick={() => handleAddTool(false)}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      disabled={!formData.name || !formData.tool_type || !formData.tool_room_id}
                      onClick={() => handleAddTool(true)}
                    >
                      Add and Goto
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          <TabsList>
            <TabsTrigger value="list">
              List
              {cityId && !loading && (
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transfer" disabled>
              Transfer
            </TabsTrigger>
            <TabsTrigger value="history" disabled>
              History
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
          </TabsList>
          </div>
        </div>

        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Select
                value={cityId}
                onValueChange={(v) => updateParams("city", v)}
              >
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

              <Select
                value={toolRoomId || "all"}
                onValueChange={(v) =>
                  updateParams("tool_room", v === "all" ? "" : v)
                }
                disabled={!cityId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All tool rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tool rooms</SelectItem>
                  {toolRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code} - {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={kitFilter || "all"}
                onValueChange={(v) =>
                  updateParams("kit_filter", v === "all" ? "" : v)
                }
                disabled={!cityId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kit filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show kit tools</SelectItem>
                  <SelectItem value="hide">Hide kit tools</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={calibDue || "all"}
                onValueChange={(v) =>
                  updateParams("calib_due", v === "all" ? "" : v)
                }
                disabled={!cityId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Calibration due" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All calibration</SelectItem>
                  <SelectItem value="60">Due within 60 days</SelectItem>
                  <SelectItem value="90">Due within 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!cityId ? (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                Please select a city to view tools
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tools.length === 0 ? (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                No tools found
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
                          Tool Name
                        </SortableTableHead>
                        <SortableTableHead
                          sortable
                          sortKey="tool_type"
                          sortState={sortState}
                          onSort={updateSort}
                        >
                          Type
                        </SortableTableHead>
                        <SortableTableHead
                          sortable
                          sortKey="description"
                          sortState={sortState}
                          onSort={updateSort}
                        >
                          Description
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
                          sortKey="serial_number"
                          sortState={sortState}
                          onSort={updateSort}
                        >
                          Serial
                        </SortableTableHead>
                        <SortableTableHead
                          sortable
                          sortKey="tool_room"
                          sortState={sortState}
                          onSort={updateSort}
                        >
                          Tool Room
                        </SortableTableHead>
                        <SortableTableHead
                          sortable
                          sortKey="calibration_due"
                          sortState={sortState}
                          onSort={updateSort}
                        >
                          Calibr. Due
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tools.map((tool) => (
                        <TableRow key={tool.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/tool/${tool.id}`)}>
                          <TableCell className="font-medium">
                            {tool.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={TOOL_TYPE_COLORS[tool.tool_type]}
                            >
                              {tool.tool_type_code}
                            </Badge>
                          </TableCell>
                          <TableCell>{tool.description || "-"}</TableCell>
                          <TableCell>{tool.make || "-"}</TableCell>
                          <TableCell>{tool.model || "-"}</TableCell>
                          <TableCell>{tool.serial_number || "-"}</TableCell>
                          <TableCell>{tool.tool_room.code}</TableCell>
                          <TableCell>
                            <CalibrationDueCell days={tool.calibration_due_days} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {tools.length} of {total} tools
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Per page:
                      </span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => updateParams("page_size", v)}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        disabled={page >= totalPages}
                        onClick={() => updateParams("page", String(page + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transfer">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Tool transfer functionality coming soon.
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Tool history functionality coming soon.
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Tool reports functionality coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
