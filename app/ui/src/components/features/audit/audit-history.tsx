"use client";

import { useState } from "react";
import { useAuditHistory } from "@/hooks/use-audit-history";
import type { AuditRecord, AuditAction } from "@/types/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditHistoryProps {
  entityType: string;
  entityId: string;
}

const actionConfig: Record<
  AuditAction,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  INSERT: { label: "Created", variant: "default" },
  UPDATE: { label: "Updated", variant: "secondary" },
  DELETE: { label: "Deleted", variant: "destructive" },
};

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function AuditRecordCard({ record }: { record: AuditRecord }) {
  const config = actionConfig[record.action];
  const timestamp = new Date(record.created_at).toLocaleString();
  const userName = record.user_id || "System";

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={config.variant}>{config.label}</Badge>
            <span className="text-sm text-muted-foreground">{timestamp}</span>
          </div>
          <span className="text-sm font-medium">{userName}</span>
        </div>
      </CardHeader>
      <CardContent>
        {record.action === "INSERT" && record.new_values && (
          <div className="text-sm text-muted-foreground">
            Record created
          </div>
        )}
        {record.action === "DELETE" && (
          <div className="text-sm text-muted-foreground">
            Record deleted
          </div>
        )}
        {record.action === "UPDATE" && record.changed_fields && record.changed_fields.length > 0 && (
          <div className="space-y-2">
            {record.changed_fields.map((field) => {
              const oldValue = record.old_values?.[field];
              const newValue = record.new_values?.[field];
              return (
                <div key={field} className="text-sm">
                  <span className="font-medium">{formatFieldName(field)}:</span>{" "}
                  <span className="text-muted-foreground line-through">
                    {formatValue(oldValue)}
                  </span>{" "}
                  <span className="text-muted-foreground">→</span>{" "}
                  <span>{formatValue(newValue)}</span>
                </div>
              );
            })}
          </div>
        )}
        {record.action === "UPDATE" && (!record.changed_fields || record.changed_fields.length === 0) && (
          <div className="text-sm text-muted-foreground">
            Record updated (no field changes captured)
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AuditHistory({ entityType, entityId }: AuditHistoryProps) {
  const [page, setPage] = useState(1);
  const { auditHistory, isLoading, error } = useAuditHistory(
    entityType,
    entityId,
    page
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load audit history. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!auditHistory || auditHistory.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No change history found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {auditHistory.items.map((record) => (
          <AuditRecordCard key={record.id} record={record} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {auditHistory.items.length} of {auditHistory.total} changes
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!auditHistory.has_next}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
