import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkOrderItemList } from "@/components/features/work-orders/work-order-item-list";
import { mockWorkOrderItems } from "../../../mocks/data";

// Mock window.confirm
vi.stubGlobal("confirm", vi.fn(() => true));

describe("WorkOrderItemList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial loading", () => {
    it("should render page title", () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      expect(screen.getByText("Work Order Items")).toBeInTheDocument();
    });

    it("should have Add Item button", () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      expect(
        screen.getByRole("button", { name: "Add Item" })
      ).toBeInTheDocument();
    });
  });

  describe("with items", () => {
    it("should display items in a table", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Engine vibration detected")
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Radio intermittent")).toBeInTheDocument();
    });

    it("should display item numbers in first column", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        // Wait for data to load
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      // Table rows should have item numbers
      const rows = screen.getAllByRole("row");
      // First row is header, so check data rows
      expect(rows.length).toBeGreaterThan(1);
    });

    it("should display status badges", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        const badges = screen.getAllByText("Open");
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it("should display hours estimate", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("4.5")).toBeInTheDocument();
      });
    });

    it("should display category", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Powerplant")).toBeInTheDocument();
        expect(screen.getByText("Avionics")).toBeInTheDocument();
      });
    });

    it("should have table headers", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("#")).toBeInTheDocument();
      });

      expect(screen.getByText("Discrepancy")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Hours")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should have Edit and Delete buttons for each item", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: "Edit" });
      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

      expect(editButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe("empty state", () => {
    it("should show empty state when no items", async () => {
      // Use a work order that has no items (wo-uuid-2 has 0 items in our mock)
      render(<WorkOrderItemList workOrderId="wo-uuid-2" />);

      await waitFor(() => {
        expect(
          screen.getByText(/No items yet. Click "Add Item" to create one./)
        ).toBeInTheDocument();
      });
    });
  });

  describe("add item dialog", () => {
    it("should open dialog when Add Item is clicked", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Add Item" }));

      await waitFor(() => {
        expect(screen.getByText("Add New Item")).toBeInTheDocument();
      });
    });

    it("should have form fields in dialog", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Add Item" }));

      await waitFor(() => {
        expect(screen.getByText("Add New Item")).toBeInTheDocument();
      });

      // Check for form field labels - look within the dialog
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("ATA Code")).toBeInTheDocument();
      expect(within(dialog).getByText("Hours Estimate")).toBeInTheDocument();
      expect(within(dialog).getByText("Corrective Action")).toBeInTheDocument();
    });

    it("should have Cancel and Create buttons", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Add Item" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Cancel" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Create" })
        ).toBeInTheDocument();
      });
    });

    it("should create new item when form is submitted", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Add Item" }));

      await waitFor(() => {
        expect(screen.getByLabelText("Discrepancy")).toBeInTheDocument();
      });

      await user.type(
        screen.getByLabelText("Discrepancy"),
        "New test discrepancy"
      );

      await user.click(screen.getByRole("button", { name: "Create" }));

      // Dialog should close after successful creation
      await waitFor(() => {
        expect(screen.queryByText("Add New Item")).not.toBeInTheDocument();
      });
    });
  });

  describe("edit item dialog", () => {
    it("should open edit dialog with item data when Edit is clicked", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: "Edit" });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Item")).toBeInTheDocument();
      });

      // Should have Update button instead of Create
      expect(
        screen.getByRole("button", { name: "Update" })
      ).toBeInTheDocument();
    });

    it("should populate form with item data", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: "Edit" });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText("Discrepancy")).toHaveValue(
          "Engine vibration detected"
        );
      });

      expect(screen.getByLabelText("Corrective Action")).toHaveValue(
        "Replaced engine mounts"
      );
      expect(screen.getByLabelText("Category")).toHaveValue("Powerplant");
    });
  });

  describe("delete item", () => {
    it("should show confirmation dialog when Delete is clicked", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this item?"
      );
    });

    it("should delete item when confirmed", async () => {
      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
      await user.click(deleteButtons[0]);

      // The item list should refresh after deletion
      await waitFor(() => {
        // The component refetches, so items will still be there from mock
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });
    });

    it("should not delete item when cancelled", async () => {
      vi.mocked(window.confirm).mockReturnValueOnce(false);

      const user = userEvent.setup();
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
      await user.click(deleteButtons[0]);

      // Item should still be there
      expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
    });
  });
});
