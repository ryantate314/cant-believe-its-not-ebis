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
import {
  createAircraft,
  updateAircraft,
  listCities,
} from "@/lib/api";
import type {
  AircraftResponse,
  AircraftCreate,
  AircraftUpdate,
  CityResponse,
} from "@/lib/api";

interface AircraftFormProps {
  aircraft?: AircraftResponse;
  onSuccess?: (aircraft: AircraftResponse) => void;
}

export function AircraftForm({ aircraft, onSuccess }: AircraftFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityResponse[]>([]);

  const [formData, setFormData] = useState({
    registration_number: aircraft?.registration_number || "",
    serial_number: aircraft?.serial_number || "",
    make: aircraft?.make || "",
    model: aircraft?.model || "",
    year_built: aircraft?.year_built?.toString() || "",
    meter_profile: aircraft?.meter_profile || "",
    primary_city_id: aircraft?.primary_city?.id || "",
    customer_name: aircraft?.customer_name || "",
    aircraft_class: aircraft?.aircraft_class || "",
    fuel_code: aircraft?.fuel_code || "",
    notes: aircraft?.notes || "",
    is_active: aircraft?.is_active ?? true,
  });

  useEffect(() => {
    listCities().then((response) => setCities(response.data.items));
  }, []);

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
      if (!formData.registration_number.trim()) {
        throw new Error("Registration number is required");
      }

      const data = {
        registration_number: formData.registration_number,
        serial_number: formData.serial_number || undefined,
        make: formData.make || undefined,
        model: formData.model || undefined,
        year_built: formData.year_built
          ? parseInt(formData.year_built, 10)
          : undefined,
        meter_profile: formData.meter_profile || undefined,
        primary_city_id: formData.primary_city_id || undefined,
        customer_name: formData.customer_name || undefined,
        aircraft_class: formData.aircraft_class || undefined,
        fuel_code: formData.fuel_code || undefined,
        notes: formData.notes || undefined,
        is_active: formData.is_active,
      };

      let result: AircraftResponse;
      if (aircraft) {
        const response = await updateAircraft(aircraft.id, {
          ...data,
          updated_by: "system",
        } as AircraftUpdate);
        result = response.data;
      } else {
        const response = await createAircraft({
          ...data,
          created_by: "system",
        } as AircraftCreate);
        result = response.data;
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/aircraft/${result.id}`);
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
          <CardTitle>Aircraft Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number *</Label>
            <Input
              id="registration_number"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="N1234A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="Cirrus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="SR22"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year_built">Year Built</Label>
            <Input
              id="year_built"
              name="year_built"
              type="number"
              value={formData.year_built}
              onChange={handleChange}
              placeholder="2020"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_class">Aircraft Class</Label>
            <Input
              id="aircraft_class"
              name="aircraft_class"
              value={formData.aircraft_class}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_code">Fuel Code</Label>
            <Input
              id="fuel_code"
              name="fuel_code"
              value={formData.fuel_code}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_city_id">Primary City</Label>
            <Select
              value={formData.primary_city_id || "none"}
              onValueChange={(v) =>
                handleSelectChange("primary_city_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No city</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.code} - {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meter_profile">Meter Profile</Label>
            <Textarea
              id="meter_profile"
              name="meter_profile"
              value={formData.meter_profile}
              onChange={handleChange}
              rows={2}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <Select
              value={formData.is_active ? "active" : "inactive"}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, is_active: v === "active" }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : aircraft
              ? "Update Aircraft"
              : "Create Aircraft"}
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
