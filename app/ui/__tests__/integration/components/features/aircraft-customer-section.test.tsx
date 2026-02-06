import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AircraftCustomerSection } from "@/components/features/aircraft/aircraft-customer-section";
import type { AircraftCustomer } from "@/types/aircraft";

const mockOnUpdate = vi.fn();

const mockCustomers: AircraftCustomer[] = [
  {
    id: "customer-uuid-1",
    name: "Acme Corp",
    email: "acme@example.com",
    is_primary: true,
  },
  {
    id: "customer-uuid-2",
    name: "Beta Aviation LLC",
    email: "beta@example.com",
    is_primary: false,
  },
];

describe("AircraftCustomerSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render customer list with primary badge", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Aviation LLC")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("should show customer emails", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText("acme@example.com")).toBeInTheDocument();
    expect(screen.getByText("beta@example.com")).toBeInTheDocument();
  });

  it("should show empty state when no customers linked", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={[]}
        onUpdate={mockOnUpdate}
      />
    );

    expect(
      screen.getByText("No customers linked to this aircraft")
    ).toBeInTheDocument();
  });

  it("should have Add Customer button", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    expect(
      screen.getByRole("button", { name: /add customer/i })
    ).toBeInTheDocument();
  });

  it("should show Set Primary button for non-primary customers", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    const setPrimaryButtons = screen.getAllByRole("button", {
      name: "Set Primary",
    });
    // Only non-primary customers should have Set Primary button
    expect(setPrimaryButtons).toHaveLength(1);
  });

  it("should not show Set Primary button for primary customer", () => {
    const singleCustomer: AircraftCustomer[] = [
      {
        id: "customer-uuid-1",
        name: "Acme Corp",
        email: "acme@example.com",
        is_primary: true,
      },
    ];

    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={singleCustomer}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.queryByRole("button", { name: "Set Primary" })).not.toBeInTheDocument();
  });

  it("should have remove buttons for each customer", () => {
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    expect(
      screen.getByRole("button", { name: "Remove Acme Corp" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Beta Aviation LLC" })
    ).toBeInTheDocument();
  });

  it("should open add customer dialog when clicking Add Customer", async () => {
    const user = userEvent.setup();
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={[]}
        onUpdate={mockOnUpdate}
      />
    );

    await user.click(screen.getByRole("button", { name: /add customer/i }));

    await waitFor(() => {
      expect(screen.getByText("Add Customer")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search customers...")
      ).toBeInTheDocument();
    });
  });

  it("should call onUpdate after setting primary", async () => {
    const user = userEvent.setup();
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    await user.click(screen.getByRole("button", { name: "Set Primary" }));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it("should call onUpdate after removing a customer", async () => {
    const user = userEvent.setup();
    render(
      <AircraftCustomerSection
        aircraftId="aircraft-uuid-1"
        customers={mockCustomers}
        onUpdate={mockOnUpdate}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Remove Beta Aviation LLC" })
    );

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });
});
