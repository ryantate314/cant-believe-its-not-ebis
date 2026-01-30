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

    it("should render all input fields", () => {
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // Check for labels
      expect(screen.getByLabelText("Registration")).toBeInTheDocument();
      expect(screen.getByLabelText("Serial Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Make")).toBeInTheDocument();
      expect(screen.getByLabelText("Model")).toBeInTheDocument();
      expect(screen.getByLabelText("Year")).toBeInTheDocument();
      expect(screen.getByLabelText("Customer Name")).toBeInTheDocument();
      expect(screen.getByLabelText("PO Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Lead Technician")).toBeInTheDocument();
      expect(screen.getByLabelText("Sales Person")).toBeInTheDocument();
      expect(screen.getByLabelText("Due Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Status Notes")).toBeInTheDocument();
    });

    it("should submit form and create work order", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      // Fill in some fields
      await user.type(screen.getByLabelText("Registration"), "N99999");
      await user.type(screen.getByLabelText("Customer Name"), "New Customer");

      // Submit the form
      await user.click(
        screen.getByRole("button", { name: "Create Work Order" })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Should navigate to the new work order
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/workorder\/wo-uuid-/)
      );
    });

    it("should call onSuccess callback instead of navigating", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<WorkOrderForm cityId="city-uuid-1" onSuccess={onSuccess} />);

      await user.click(
        screen.getByRole("button", { name: "Create Work Order" })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
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
    it("should populate form with existing work order data", () => {
      render(<WorkOrderForm cityId="city-uuid-1" workOrder={mockWorkOrder} />);

      expect(screen.getByLabelText("Registration")).toHaveValue("N12345");
      expect(screen.getByLabelText("Serial Number")).toHaveValue("SN12345");
      expect(screen.getByLabelText("Make")).toHaveValue("Cessna");
      expect(screen.getByLabelText("Model")).toHaveValue("172");
      expect(screen.getByLabelText("Year")).toHaveValue(2020);
      expect(screen.getByLabelText("Customer Name")).toHaveValue(
        "Test Customer"
      );
      expect(screen.getByLabelText("PO Number")).toHaveValue("PO-001");
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

      // Modify a field
      const customerInput = screen.getByLabelText("Customer Name");
      await user.clear(customerInput);
      await user.type(customerInput, "Updated Customer");

      await user.click(
        screen.getByRole("button", { name: "Update Work Order" })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("form validation and input handling", () => {
    it("should update form state when typing", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      const registrationInput = screen.getByLabelText("Registration");
      await user.type(registrationInput, "N12345");

      expect(registrationInput).toHaveValue("N12345");
    });

    it("should handle year input as number", async () => {
      const user = userEvent.setup();
      render(<WorkOrderForm cityId="city-uuid-1" />);

      const yearInput = screen.getByLabelText("Year");
      await user.type(yearInput, "2025");

      expect(yearInput).toHaveValue(2025);
    });

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
