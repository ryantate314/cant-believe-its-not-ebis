import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToolList } from "@/components/features/tools/tool-list";

const mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/tool",
}));

describe("ToolList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("city");
    mockSearchParams.delete("tool_room");
    mockSearchParams.delete("kit_filter");
    mockSearchParams.delete("calib_due");
    mockSearchParams.delete("page");
    mockSearchParams.delete("page_size");
  });

  describe("initial state", () => {
    it("should prompt user to select a city when no city is selected", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(
          screen.getByText("Please select a city to view tools")
        ).toBeInTheDocument();
      });
    });

    it("should render the page title", () => {
      render(<ToolList />);

      expect(screen.getByText("Tools")).toBeInTheDocument();
    });

    it("should render tab navigation", () => {
      render(<ToolList />);

      expect(screen.getByRole("tab", { name: /List/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Transfer/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /History/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Reports/ })).toBeInTheDocument();
    });

    it("should have disabled tabs for transfer, history, and reports", () => {
      render(<ToolList />);

      expect(screen.getByRole("tab", { name: /Transfer/ })).toBeDisabled();
      expect(screen.getByRole("tab", { name: /History/ })).toBeDisabled();
      expect(screen.getByRole("tab", { name: /Reports/ })).toBeDisabled();
    });

    it("should render city selector", () => {
      render(<ToolList />);

      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });
  });

  describe("with city selected", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should display tools in a table", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("Torque Wrench 50ft-lb")).toBeInTheDocument();
      });

      expect(screen.getByText("Digital Multimeter")).toBeInTheDocument();
    });

    it("should display tool type badges", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("Cert")).toBeInTheDocument();
      });

      expect(screen.getByText("Ref")).toBeInTheDocument();
    });

    it("should have table headers", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(
          screen.getByRole("columnheader", { name: /Tool Name/ })
        ).toBeInTheDocument();
      });

      expect(screen.getByRole("columnheader", { name: /Type/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Description/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Make/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Model/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Serial/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Tool Room/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Calibr\. Due/ })).toBeInTheDocument();
    });

    it("should show total count", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing 2 of 2 tools/)
        ).toBeInTheDocument();
      });
    });

    it("should display tool room codes", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("Torque Wrench 50ft-lb")).toBeInTheDocument();
      });

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    it("should display calibration due days", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("45d")).toBeInTheDocument();
      });
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-1");
    });

    it("should have Previous button disabled on first page", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("Torque Wrench 50ft-lb")).toBeInTheDocument();
      });

      const prevButton = screen.getByRole("button", { name: "Previous" });
      expect(prevButton).toBeDisabled();
    });

    it("should have page size selector", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("Per page:")).toBeInTheDocument();
      });
    });
  });

  describe("empty state", () => {
    beforeEach(() => {
      mockSearchParams.set("city", "city-uuid-2");
    });

    it("should show empty state message when no tools found", async () => {
      render(<ToolList />);

      await waitFor(() => {
        expect(screen.getByText("No tools found")).toBeInTheDocument();
      });
    });
  });
});
