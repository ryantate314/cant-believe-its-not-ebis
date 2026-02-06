import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerList } from "@/components/features/customers/customer-list";

// Mock useSearchParams to control URL params
const mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/customers",
}));

describe("CustomerList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("search");
    mockSearchParams.delete("page");
    mockSearchParams.delete("sort_by");
    mockSearchParams.delete("sort_order");
  });

  describe("initial state", () => {
    it("should render the page title", () => {
      render(<CustomerList />);

      expect(screen.getByText("Customers")).toBeInTheDocument();
    });

    it("should render New Customer button", () => {
      render(<CustomerList />);

      expect(screen.getByText("New Customer")).toBeInTheDocument();
    });

    it("should have search input", () => {
      render(<CustomerList />);

      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });
  });

  describe("data display", () => {
    it("should display customers in a table", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      expect(screen.getByText("Beta Aviation LLC")).toBeInTheDocument();
    });

    it("should show customer email and phone columns", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("acme@example.com")).toBeInTheDocument();
      });

      expect(screen.getByText("555-0100")).toBeInTheDocument();
    });

    it("should show status badge", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it("should show total count", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing 2 of 2 customers/)
        ).toBeInTheDocument();
      });
    });

    it("should have sortable table headers", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Email/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Created/ })).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should navigate to customer detail when row is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const row = screen.getByText("Acme Corp").closest("tr");
      await user.click(row!);

      expect(mockPush).toHaveBeenCalledWith("/customers/customer-uuid-1");
    });

    it("should navigate to new customer page", async () => {
      const user = userEvent.setup();
      render(<CustomerList />);

      const newButton = screen.getByText("New Customer");
      await user.click(newButton);

      expect(mockPush).toHaveBeenCalledWith("/customers/new");
    });
  });

  describe("search", () => {
    it("should have search input with placeholder", () => {
      render(<CustomerList />);

      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty message when no results match search", async () => {
      mockSearchParams.set("search", "zzzznonexistent");
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("No customers found")).toBeInTheDocument();
      });
    });
  });

  describe("pagination", () => {
    it("should have Previous button disabled on first page", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const prevButton = screen.getByRole("button", { name: "Previous" });
      expect(prevButton).toBeDisabled();
    });

    it("should have Next button disabled when results less than page size", async () => {
      render(<CustomerList />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: "Next" });
      expect(nextButton).toBeDisabled();
    });
  });
});
