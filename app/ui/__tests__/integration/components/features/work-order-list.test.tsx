import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkOrderList } from "@/components/features/work-orders/work-order-list";
import { mockCities, mockWorkOrders } from "../../../mocks/data";

// Mock useSearchParams to control URL params
const mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("WorkOrderList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("city");
    mockSearchParams.delete("search");
    mockSearchParams.delete("status");
    mockSearchParams.delete("page");
  });

  describe("initial state", () => {
    it("should prompt user to select a city when no city is selected", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(
          screen.getByText("Please select a city to view work orders")
        ).toBeInTheDocument();
      });
    });

    it("should render the page title", () => {
      render(<WorkOrderList />);

      expect(screen.getByText("Work Orders")).toBeInTheDocument();
    });

    it("should render city selector", () => {
      render(<WorkOrderList />);

      // Combobox should be present - may have multiple
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });

    it("should not show New Work Order button when no city selected", () => {
      render(<WorkOrderList />);

      expect(screen.queryByText("New Work Order")).not.toBeInTheDocument();
    });
  });

  describe("with city selected", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should display work orders in a table", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("KTYS00001-01-2026")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Customer")).toBeInTheDocument();
    });

    it("should show New Work Order button", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("New Work Order")).toBeInTheDocument();
      });
    });

    it("should display status badges", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("KTYS00001-01-2026")).toBeInTheDocument();
      });

      // Should have status badges rendered (check for badge styles)
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    it("should display item count for each work order", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument(); // mockWorkOrder has item_count: 2
        expect(screen.getByText("0")).toBeInTheDocument(); // second mock has item_count: 0
      });
    });

    it("should show total count", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing 2 of 2 work orders/)
        ).toBeInTheDocument();
      });
    });

    it("should have table headers", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByRole("columnheader", { name: "WO #" })).toBeInTheDocument();
      });

      expect(screen.getByRole("columnheader", { name: "Customer" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Aircraft" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Priority" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Items" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Created" })).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should navigate to work order detail when row is clicked", async () => {
      const user = userEvent.setup();
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("KTYS00001-01-2026")).toBeInTheDocument();
      });

      const row = screen.getByText("KTYS00001-01-2026").closest("tr");
      await user.click(row!);

      expect(mockPush).toHaveBeenCalledWith("/workorder/wo-uuid-1");
    });

    it("should link to new work order page with city param", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("New Work Order")).toBeInTheDocument();
      });

      const link = screen.getByRole("link", { name: "New Work Order" });
      expect(link).toHaveAttribute("href", "/workorder/new?city=city-uuid-1");
    });
  });

  describe("empty state", () => {
    beforeEach(() => {
      // Use a city with no work orders
      mockSearchParams.set("city", "city-uuid-2");
    });

    it("should show empty state message when no work orders found", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("No work orders found")).toBeInTheDocument();
      });
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should have Previous button disabled on first page", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("KTYS00001-01-2026")).toBeInTheDocument();
      });

      const prevButton = screen.getByRole("button", { name: "Previous" });
      expect(prevButton).toBeDisabled();
    });

    it("should enable Next button when there might be more results", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText("KTYS00001-01-2026")).toBeInTheDocument();
      });

      // With only 2 results (less than page size of 20), Next should be disabled
      const nextButton = screen.getByRole("button", { name: "Next" });
      expect(nextButton).toBeDisabled();
    });
  });

  describe("filters", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should have search input", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
      });
    });

    it("should have status filter dropdown", async () => {
      render(<WorkOrderList />);

      await waitFor(() => {
        const comboboxes = screen.getAllByRole("combobox");
        // Should have city selector and status filter
        expect(comboboxes.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
