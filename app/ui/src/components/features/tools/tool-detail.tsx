"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toolsApi } from "@/lib/api";
import type { ToolDetail as ToolDetailType } from "@/types/tool";

const TOOL_TYPE_COLORS: Record<string, string> = {
  certified: "bg-blue-100 text-blue-800",
  reference: "bg-purple-100 text-purple-800",
  consumable: "bg-gray-100 text-gray-800",
  kit: "bg-green-100 text-green-800",
};

const TOOL_GROUP_LABELS: Record<string, string> = {
  in_service: "In Service",
  out_of_service: "Out of Service",
  lost: "Lost",
  retired: "Retired",
};

interface ToolDetailProps {
  toolId: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString();
}

function formatCurrency(value: number | null): string {
  if (value === null) return "-";
  return `$${value.toFixed(2)}`;
}

function CalibrationDueBadge({ days }: { days: number | null }) {
  if (days === null) return <span>-</span>;

  let colorClass = "text-foreground";
  if (days < 0) {
    colorClass = "text-red-600 font-semibold";
  } else if (days <= 30) {
    colorClass = "text-orange-600 font-semibold";
  } else if (days <= 60) {
    colorClass = "text-yellow-600 font-semibold";
  }

  return <span className={colorClass}>{days} days</span>;
}

export function ToolDetail({ toolId }: ToolDetailProps) {
  const router = useRouter();
  const [tool, setTool] = useState<ToolDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    toolsApi
      .get(toolId)
      .then(setTool)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [toolId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {error || "Tool not found"}
      </div>
    );
  }

  const showCalibrationCard = tool.tool_type === "certified";
  const showKitCard = tool.is_in_kit || tool.kit_tools.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <h1 className="text-2xl font-bold">{tool.name}</h1>
        <Badge variant="outline" className={TOOL_TYPE_COLORS[tool.tool_type]}>
          {tool.tool_type_code}
        </Badge>
        <Badge variant="secondary">
          {TOOL_GROUP_LABELS[tool.tool_group] || tool.tool_group}
        </Badge>
      </div>

      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">Main Info</TabsTrigger>
          <TabsTrigger value="media" disabled>
            Media
          </TabsTrigger>
          <TabsTrigger value="certifications" disabled>
            Certifications
          </TabsTrigger>
          <TabsTrigger value="transfer-history" disabled>
            Transfer History
          </TabsTrigger>
          <TabsTrigger value="edit-history" disabled>
            Edit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Description
                  </dt>
                  <dd className="mt-1">{tool.description || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Details
                  </dt>
                  <dd className="mt-1">{tool.details || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Tool Room
                  </dt>
                  <dd className="mt-1">
                    {tool.tool_room.code} - {tool.tool_room.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    City
                  </dt>
                  <dd className="mt-1">
                    {tool.city.code} - {tool.city.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Make
                  </dt>
                  <dd className="mt-1">{tool.make || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Model
                  </dt>
                  <dd className="mt-1">{tool.model || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Serial Number
                  </dt>
                  <dd className="mt-1">{tool.serial_number || "-"}</dd>
                </div>
                {/* TODO: Convert Vendor to a lookup field (vendor entity with search) */}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Vendor
                  </dt>
                  <dd className="mt-1">{tool.vendor_name || "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Location
                  </dt>
                  <dd className="mt-1">{tool.location || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Location Notes
                  </dt>
                  <dd className="mt-1">{tool.location_notes || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Tool Cost
                  </dt>
                  <dd className="mt-1">{formatCurrency(tool.tool_cost)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Purchase Date
                  </dt>
                  <dd className="mt-1">{formatDate(tool.purchase_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Date Labeled
                  </dt>
                  <dd className="mt-1">{formatDate(tool.date_labeled)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {showCalibrationCard && (
            <Card>
              <CardHeader>
                <CardTitle>Calibration</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Calibration Interval
                    </dt>
                    <dd className="mt-1">
                      {tool.calibration_days !== null
                        ? `${tool.calibration_days} days`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Calibration Cost
                    </dt>
                    <dd className="mt-1">
                      {formatCurrency(tool.calibration_cost)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Last Calibration Date
                    </dt>
                    <dd className="mt-1">
                      {formatDate(tool.last_calibration_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Next Calibration Due
                    </dt>
                    <dd className="mt-1">
                      {formatDate(tool.next_calibration_due)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Days Until Due
                    </dt>
                    <dd className="mt-1">
                      <CalibrationDueBadge days={tool.calibration_due_days} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Calibration Notes
                    </dt>
                    <dd className="mt-1">
                      {tool.calibration_notes || "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {showKitCard && (
            <Card>
              <CardHeader>
                <CardTitle>Kit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 md:grid-cols-1">
                  {tool.is_in_kit && tool.parent_kit && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Parent Kit
                      </dt>
                      <dd className="mt-1">
                        <Link
                          href={`/tool/${tool.parent_kit.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {tool.parent_kit.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {tool.kit_tools.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Kit Contents
                      </dt>
                      <dd className="mt-1">
                        <ul className="space-y-1">
                          {tool.kit_tools.map((kitTool) => (
                            <li key={kitTool.id}>
                              <Link
                                href={`/tool/${kitTool.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {kitTool.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created By
                  </dt>
                  <dd className="mt-1">{tool.created_by || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created At
                  </dt>
                  <dd className="mt-1">
                    {new Date(tool.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated By
                  </dt>
                  <dd className="mt-1">{tool.updated_by || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </dt>
                  <dd className="mt-1">
                    {new Date(tool.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
