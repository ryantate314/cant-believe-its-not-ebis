"use client";

import { useState } from "react";
import { Star, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { customersApi } from "@/lib/api";
import type { AircraftCustomer } from "@/types/aircraft";
import type { Customer } from "@/types/customer";

interface AircraftCustomerSectionProps {
  aircraftId: string;
  customers: AircraftCustomer[];
  onUpdate: () => void;
}

export function AircraftCustomerSection({
  aircraftId,
  customers,
  onUpdate,
}: AircraftCustomerSectionProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setCustomerLoading(true);
    try {
      const response = await customersApi.list({
        active_only: true,
        page_size: 100,
      });
      setCustomerList(response.items);
    } catch {
      setError("Failed to load customers");
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleLinkCustomer = async (customerId: string) => {
    setActionLoading(customerId);
    setError(null);
    try {
      await customersApi.linkAircraft(customerId, aircraftId);
      setAddModalOpen(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link customer");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkCustomer = async (customerId: string) => {
    setActionLoading(customerId);
    setError(null);
    try {
      await customersApi.unlinkAircraft(customerId, aircraftId);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to unlink customer"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrimary = async (customerId: string) => {
    setActionLoading(customerId);
    setError(null);
    try {
      await customersApi.setPrimaryAircraft(customerId, aircraftId);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set primary customer"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Filter out already-linked customers from the add modal
  const linkedCustomerIds = new Set(customers.map((c) => c.id));
  const availableCustomers = customerList.filter(
    (c) => !linkedCustomerIds.has(c.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customers</CardTitle>
        <Button variant="outline" size="sm" onClick={handleOpenAddModal}>
          + Add Customer
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No customers linked to this aircraft
          </p>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  {customer.is_primary && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  <div>
                    <span className="font-medium">{customer.name}</span>
                    {customer.is_primary && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Primary
                      </Badge>
                    )}
                    {customer.email && (
                      <p className="text-sm text-muted-foreground">
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!customer.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(customer.id)}
                      disabled={actionLoading === customer.id}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlinkCustomer(customer.id)}
                    disabled={actionLoading === customer.id}
                    aria-label={`Remove ${customer.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Search for a customer to link to this aircraft.
              </DialogDescription>
            </DialogHeader>
            <Command className="rounded-lg border">
              <CommandInput placeholder="Search customers..." />
              <CommandList className="max-h-[300px]">
                {customerLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading customers...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      {availableCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name} ${customer.email || ""}`}
                          onSelect={() => handleLinkCustomer(customer.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className="mr-2 h-4 w-4 opacity-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {customer.email && (
                              <span className="text-sm text-muted-foreground">
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
