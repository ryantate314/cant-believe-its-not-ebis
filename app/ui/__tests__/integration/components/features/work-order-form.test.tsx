import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkOrderForm } from "@/components/features/work-orders/work-order-form";
import { mockWorkOrder } from "../../../mocks/data";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe("WorkOrderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode", () => {
    it("should render the form with empty fields", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      expect(screen.getByText("Work Order Details")).toBeInTheDocument();
      expect(screen.getByText("Aircraft Information")).toBeInTheDocument();
      expect(screen.getByText("Customer Information")).toBeInTheDocument();
      expect(screen.getByText("Assignment")).toBeInTheDocument();
    });

    it("should have Create Work Order button", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      expect(
        screen.getByRole("button", { name: "Create Work Order" })
      ).toBeInTheDocument();
    });

    it("should have Cancel button", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    it("should navigate back when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockBack).toHaveBeenCalled();
    });

    it("should render all input fields", async () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // Wait for aircraft to load
      await waitFor(() => {
        expect(screen.getByText("Aircraft *")).toBeInTheDocument();
      });

      // Check for labels (customer fields are now readonly, not inputs)
      expect(screen.getByLabelText("Lead Technician")).toBeInTheDocument();
      expect(screen.getByLabelText("Sales Person")).toBeInTheDocument();
      expect(screen.getByLabelText("Due Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Status Notes")).toBeInTheDocument();
    });

    it("should show message to select aircraft for customer info", async () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Select an aircraft to see customer information")
        ).toBeInTheDocument();
      });
    });

    it("should open aircraft selection modal when clicking Select button", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // Wait for aircraft to load
      await waitFor(() => {
        expect(screen.queryByText("Loading aircraft...")).not.toBeInTheDocument();
      });

      // Click the aircraft selector button
      const aircraftButton = screen.getByRole("button", { name: /select aircraft/i });
      await user.click(aircraftButton);

      // Modal should open with search input
      await waitFor(() => {
        expect(screen.getByText("Select Aircraft")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search aircraft...")).toBeInTheDocument();
      });
    });

    it("should show error when submitting without aircraft", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // Wait for aircraft to load
      await waitFor(() => {
        expect(screen.queryByText("Loading aircraft...")).not.toBeInTheDocument();
      });

      // Submit without selecting aircraft
      await user.click(
        screen.getByRole("button", { name: "Create Work Order" })
      );

      await waitFor(() => {
        expect(screen.getByText("Please select an aircraft")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should show submit button with correct initial text", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      const submitButton = screen.getByRole("button", {
        name: "Create Work Order",
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should have enabled buttons initially", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      const submitButton = screen.getByRole("button", {
        name: "Create Work Order",
      });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });

      expect(submitButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe("edit mode", () => {
    it("should display customer info as readonly from work order", async () => {
      render(<WorkOrderForm cityId="city-uuid-1" workOrder={mockWorkOrder} />);

      // Wait for aircraft to load
      await waitFor(() => {
        expect(screen.queryByText("Loading aircraft...")).not.toBeInTheDocument();
      });

      // Customer should be displayed as readonly text, not an input
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    it("should have Update Work Order button", () => {
      render(<WorkOrderForm cityId="city-uuid-1" workOrder={mockWorkOrder} />);

      expect(
        screen.getByRole("button", { name: "Update Work Order" })
      ).toBeInTheDocument();
    });

    it("should update work order on submit", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(
        <WorkOrderForm
          cityId="city-uuid-1"
          workOrder={mockWorkOrder}
          onSuccess={onSuccess}
        />
      );

      // Wait for aircraft to load
      await waitFor(() => {
        expect(screen.queryByText("Loading aircraft...")).not.toBeInTheDocument();
      });

      // Modify a field (use lead_technician since customer is now readonly)
      const techInput = screen.getByLabelText("Lead Technician");
      await user.clear(techInput);
      await user.type(techInput, "Updated Technician");

      await user.click(
        screen.getByRole("button", { name: "Update Work Order" })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("form validation and input handling", () => {
    it("should handle textarea input", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      const notesInput = screen.getByLabelText("Status Notes");
      await user.type(notesInput, "Some notes here");

      expect(notesInput).toHaveValue("Some notes here");
    });
  });

  describe("select inputs", () => {
    it("should have work order type selector", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // The select trigger should be present
      const typeLabel = screen.getByText("Type");
      expect(typeLabel).toBeInTheDocument();
    });

    it("should have priority selector", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // The select trigger should be present
      const priorityLabel = screen.getByText("Priority");
      expect(priorityLabel).toBeInTheDocument();
    });
  });
});
