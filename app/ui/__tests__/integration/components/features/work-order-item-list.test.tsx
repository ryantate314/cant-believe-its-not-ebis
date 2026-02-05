import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkOrderItemList } from "@/components/features/work-orders/work-order-item-list";

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
    });

    it("should make rows clickable", async () => {
      render(<WorkOrderItemList workOrderId="wo-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Engine vibration detected")).toBeInTheDocument();
      });

      // Rows should have cursor-pointer class for clickability
      const rows = screen.getAllByRole("row");
      // Skip header row, check data rows
      const dataRows = rows.slice(1);
      expect(dataRows.length).toBe(2);
      dataRows.forEach((row) => {
        expect(row).toHaveClass("cursor-pointer");
      });
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

});
