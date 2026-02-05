"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLaborKit,
  updateLaborKit,
} from "@/lib/api";
import type { LaborKitResponse } from "@/lib/api";
import { LABOR_KIT_CATEGORIES } from "@/types/labor-kit";
import { LaborKitItemList } from "./labor-kit-item-list";

interface LaborKitDetailProps {
  kitId: string;
}

export function LaborKitDetail({ kitId }: LaborKitDetailProps) {
  const router = useRouter();
  const [kit, setKit] = useState<LaborKitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    is_active: true,
  });

  const fetchKit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLaborKit(kitId);
      const data = response.data;
      setKit(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        category: data.category || "",
        is_active: data.is_active,
      });
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    fetchKit();
  }, [fetchKit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLaborKit(kitId, {
        ...formData,
        updated_by: "system",
      });
      router.push("/admin/laborkit");
    } catch (error) {
      console.error("Failed to save labor kit:", error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/laborkit");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Labor kit not found.{" "}
        <Link href="/admin/laborkit" className="text-primary underline">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/laborkit">
          <Button variant="ghost" size="sm">
            &larr; Back to list
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Labor Kit</h1>

        <div className="space-y-4 max-w-xl">
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      <LaborKitItemList kitId={kitId} />
    </div>
  );
}
