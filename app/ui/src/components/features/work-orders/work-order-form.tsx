"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { workOrdersApi, aircraftApi } from "@/lib/api";
import type {
  WorkOrder,
  WorkOrderCreateInput,
  WorkOrderUpdateInput,
} from "@/types";
import type { Aircraft } from "@/types/aircraft";

interface WorkOrderFormProps {
  cityId: string;
  workOrder?: WorkOrder;
  onSuccess?: (workOrder: WorkOrder) => void;
}

export function WorkOrderForm({
  cityId,
  workOrder,
  onSuccess,
}: WorkOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [aircraftLoading, setAircraftLoading] = useState(true);
  const [aircraftModalOpen, setAircraftModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    work_order_type: workOrder?.work_order_type || "work_order",
    priority: workOrder?.priority || "normal",
    aircraft_id: workOrder?.aircraft?.id || "",
    customer_name: workOrder?.customer_name || "",
    customer_po_number: workOrder?.customer_po_number || "",
    due_date: workOrder?.due_date || "",
    lead_technician: workOrder?.lead_technician || "",
    sales_person: workOrder?.sales_person || "",
    status_notes: workOrder?.status_notes || "",
  });

  // Fetch aircraft list on mount
  useEffect(() => {
    async function fetchAircraft() {
      try {
        const response = await aircraftApi.list({ active_only: true, page_size: 100 });
        setAircraftList(response.items);
      } catch (err) {
        console.error("Failed to fetch aircraft:", err);
      } finally {
        setAircraftLoading(false);
      }
    }
    fetchAircraft();
  }, []);

  // Get selected aircraft details
  const selectedAircraft = aircraftList.find((a) => a.id === formData.aircraft_id);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAircraftSelect = (aircraftId: string) => {
    setFormData((prev) => ({ ...prev, aircraft_id: aircraftId }));
    setAircraftModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate aircraft selection for new work orders
    if (!workOrder && !formData.aircraft_id) {
      setError("Please select an aircraft");
      setLoading(false);
      return;
    }

    try {
      const data = {
        ...formData,
        due_date: formData.due_date || undefined,
      };

      let result: WorkOrder;
      if (workOrder) {
        const updateData: WorkOrderUpdateInput = {
          work_order_type: data.work_order_type,
          priority: data.priority,
          customer_name: data.customer_name || undefined,
          customer_po_number: data.customer_po_number || undefined,
          due_date: data.due_date,
          lead_technician: data.lead_technician || undefined,
          sales_person: data.sales_person || undefined,
          status_notes: data.status_notes || undefined,
          updated_by: "system",
        };
        // Only include aircraft_id if it changed
        if (data.aircraft_id && data.aircraft_id !== workOrder.aircraft.id) {
          updateData.aircraft_id = data.aircraft_id;
        }
        result = await workOrdersApi.update(workOrder.id, updateData);
      } else {
        result = await workOrdersApi.create({
          city_id: cityId,
          aircraft_id: data.aircraft_id,
          created_by: "system",
          work_order_type: data.work_order_type,
          priority: data.priority,
          customer_name: data.customer_name || undefined,
          customer_po_number: data.customer_po_number || undefined,
          due_date: data.due_date,
          lead_technician: data.lead_technician || undefined,
          sales_person: data.sales_person || undefined,
          status_notes: data.status_notes || undefined,
        } as WorkOrderCreateInput);
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/workorder/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Work Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="work_order_type">Type</Label>
            <Select
              value={formData.work_order_type}
              onValueChange={(v) => handleSelectChange("work_order_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_order">Work Order</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(v) => handleSelectChange("priority", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="status_notes">Status Notes</Label>
            <Textarea
              id="status_notes"
              name="status_notes"
              value={formData.status_notes}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Aircraft *</Label>
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex-1 flex items-center rounded-md border bg-muted px-3 py-2 text-sm",
                  !selectedAircraft && "text-muted-foreground"
                )}
              >
                {aircraftLoading
                  ? "Loading aircraft..."
                  : selectedAircraft
                    ? `${selectedAircraft.registration_number} - ${selectedAircraft.make} ${selectedAircraft.model}`
                    : "No aircraft selected"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Select aircraft"
                onClick={() => setAircraftModalOpen(true)}
                disabled={aircraftLoading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedAircraft && (
            <div className="md:col-span-2 rounded-md bg-muted p-4 text-sm">
              <div className="grid gap-2 md:grid-cols-4">
                <div>
                  <span className="font-medium">Registration:</span>{" "}
                  {selectedAircraft.registration_number}
                </div>
                <div>
                  <span className="font-medium">Serial:</span>{" "}
                  {selectedAircraft.serial_number || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Make/Model:</span>{" "}
                  {selectedAircraft.make} {selectedAircraft.model}
                </div>
                <div>
                  <span className="font-medium">Year:</span>{" "}
                  {selectedAircraft.year_built || "N/A"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aircraft Selection Modal */}
      <Dialog open={aircraftModalOpen} onOpenChange={setAircraftModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Aircraft</DialogTitle>
            <DialogDescription>
              Search for an aircraft by registration number, make, or model.
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search aircraft..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No aircraft found.</CommandEmpty>
              <CommandGroup>
                {aircraftList.map((aircraft) => (
                  <CommandItem
                    key={aircraft.id}
                    value={`${aircraft.registration_number} ${aircraft.make} ${aircraft.model} ${aircraft.serial_number || ""}`}
                    onSelect={() => handleAircraftSelect(aircraft.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.aircraft_id === aircraft.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {aircraft.registration_number}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {aircraft.make} {aircraft.model}
                        {aircraft.year_built ? ` (${aircraft.year_built})` : ""}
                        {aircraft.customer_name ? ` - ${aircraft.customer_name}` : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_po_number">PO Number</Label>
            <Input
              id="customer_po_number"
              name="customer_po_number"
              value={formData.customer_po_number}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lead_technician">Lead Technician</Label>
            <Input
              id="lead_technician"
              name="lead_technician"
              value={formData.lead_technician}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_person">Sales Person</Label>
            <Input
              id="sales_person"
              name="sales_person"
              value={formData.sales_person}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : workOrder
              ? "Update Work Order"
              : "Create Work Order"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
