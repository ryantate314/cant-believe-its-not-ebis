"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { workOrdersApi } from "@/lib/api";
import type {
  WorkOrder,
  WorkOrderCreateInput,
  WorkOrderUpdateInput,
  PriorityLevel,
  WorkOrderType,
} from "@/types";

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

  const [formData, setFormData] = useState({
    work_order_type: workOrder?.work_order_type || "work_order",
    priority: workOrder?.priority || "normal",
    aircraft_registration: workOrder?.aircraft_registration || "",
    aircraft_serial: workOrder?.aircraft_serial || "",
    aircraft_make: workOrder?.aircraft_make || "",
    aircraft_model: workOrder?.aircraft_model || "",
    aircraft_year: workOrder?.aircraft_year?.toString() || "",
    customer_name: workOrder?.customer_name || "",
    customer_po_number: workOrder?.customer_po_number || "",
    due_date: workOrder?.due_date || "",
    lead_technician: workOrder?.lead_technician || "",
    sales_person: workOrder?.sales_person || "",
    status_notes: workOrder?.status_notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        aircraft_year: formData.aircraft_year
          ? parseInt(formData.aircraft_year, 10)
          : undefined,
        due_date: formData.due_date || undefined,
      };

      let result: WorkOrder;
      if (workOrder) {
        result = await workOrdersApi.update(workOrder.id, {
          ...data,
          updated_by: "system",
        } as WorkOrderUpdateInput);
      } else {
        result = await workOrdersApi.create({
          ...data,
          city_id: cityId,
          created_by: "system",
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
          <div className="space-y-2">
            <Label htmlFor="aircraft_registration">Registration</Label>
            <Input
              id="aircraft_registration"
              name="aircraft_registration"
              value={formData.aircraft_registration}
              onChange={handleChange}
              placeholder="N12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_serial">Serial Number</Label>
            <Input
              id="aircraft_serial"
              name="aircraft_serial"
              value={formData.aircraft_serial}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_make">Make</Label>
            <Input
              id="aircraft_make"
              name="aircraft_make"
              value={formData.aircraft_make}
              onChange={handleChange}
              placeholder="Cirrus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_model">Model</Label>
            <Input
              id="aircraft_model"
              name="aircraft_model"
              value={formData.aircraft_model}
              onChange={handleChange}
              placeholder="SR22"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_year">Year</Label>
            <Input
              id="aircraft_year"
              name="aircraft_year"
              type="number"
              value={formData.aircraft_year}
              onChange={handleChange}
              placeholder="2020"
            />
          </div>
        </CardContent>
      </Card>

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
