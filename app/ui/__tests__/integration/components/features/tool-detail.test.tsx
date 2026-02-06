import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolDetail } from "@/components/features/tools/tool-detail";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe("ToolDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should render loading skeletons initially", () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      const skeletons = document.querySelectorAll('[class*="skeleton" i], [data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("should show error message on 404", async () => {
      render(<ToolDetail toolId="nonexistent-id" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Tool not found|API error/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("successful load - certified tool", () => {
    it("should show tool name", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Torque Wrench 50ft-lb")).toBeInTheDocument();
      });
    });

    it("should show tool type badge", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Cert")).toBeInTheDocument();
      });
    });

    it("should show tool group badge", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("In Service")).toBeInTheDocument();
      });
    });

    it("should render all 5 tabs with 4 disabled", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Main Info" })).toBeInTheDocument();
      });

      expect(screen.getByRole("tab", { name: "Media" })).toBeDisabled();
      expect(screen.getByRole("tab", { name: "Certifications" })).toBeDisabled();
      expect(screen.getByRole("tab", { name: "Transfer History" })).toBeDisabled();
      expect(screen.getByRole("tab", { name: "Edit History" })).toBeDisabled();
    });

    it("should show tool information card fields", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Tool Information")).toBeInTheDocument();
      });

      expect(screen.getByText("Calibrated torque wrench")).toBeInTheDocument();
      expect(screen.getByText("Used for engine mount bolts")).toBeInTheDocument();
      expect(screen.getByText("TR-001 - Main Tool Room")).toBeInTheDocument();
      expect(screen.getByText("KTYS - Knoxville McGhee Tyson")).toBeInTheDocument();
      expect(screen.getByText("Snap-On")).toBeInTheDocument();
      expect(screen.getByText("TW-50")).toBeInTheDocument();
      expect(screen.getByText("SN-001")).toBeInTheDocument();
      expect(screen.getByText("Snap-On Tools Inc")).toBeInTheDocument();
    });

    it("should show location & purchase card with formatted cost", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Location & Purchase")).toBeInTheDocument();
      });

      expect(screen.getByText("Cabinet A-3")).toBeInTheDocument();
      expect(screen.getByText("Top shelf, left side")).toBeInTheDocument();
      expect(screen.getByText("$249.99")).toBeInTheDocument();
    });

    it("should show calibration card for certified tools", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Calibration")).toBeInTheDocument();
      });

      expect(screen.getByText("365 days")).toBeInTheDocument();
      expect(screen.getByText("$75.00")).toBeInTheDocument();
      expect(screen.getByText("45 days")).toBeInTheDocument();
      expect(screen.getByText("Annual calibration required")).toBeInTheDocument();
    });

    it("should show audit information card", async () => {
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Audit Information")).toBeInTheDocument();
      });

      expect(screen.getByText("admin_user")).toBeInTheDocument();
      expect(screen.getByText("tech_user")).toBeInTheDocument();
    });

    it("should navigate back when back button is clicked", async () => {
      const user = userEvent.setup();
      render(<ToolDetail toolId="tool-uuid-1" />);

      await waitFor(() => {
        expect(screen.getByText("Torque Wrench 50ft-lb")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Back" }));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("non-certified tool", () => {
    it("should hide calibration card for non-certified tools", async () => {
      render(<ToolDetail toolId="tool-uuid-2" />);

      await waitFor(() => {
        expect(screen.getByText("Digital Multimeter")).toBeInTheDocument();
      });

      expect(screen.queryByText("Calibration")).not.toBeInTheDocument();
    });

    it("should show dash for null fields", async () => {
      render(<ToolDetail toolId="tool-uuid-2" />);

      await waitFor(() => {
        expect(screen.getByText("Digital Multimeter")).toBeInTheDocument();
      });

      // Multiple null fields should render as "-"
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("kit tool", () => {
    it("should show kit contents with links", async () => {
      render(<ToolDetail toolId="tool-uuid-kit" />);

      await waitFor(() => {
        expect(screen.getByText("Kit Information")).toBeInTheDocument();
      });

      expect(screen.getByText("Kit Contents")).toBeInTheDocument();

      const wrenchLink = screen.getByRole("link", { name: "Torque Wrench 50ft-lb" });
      expect(wrenchLink).toHaveAttribute("href", "/tool/tool-uuid-1");

      const meterLink = screen.getByRole("link", { name: "Digital Multimeter" });
      expect(meterLink).toHaveAttribute("href", "/tool/tool-uuid-2");
    });
  });

  describe("tool in kit", () => {
    it("should show parent kit link when tool is in a kit", async () => {
      render(<ToolDetail toolId="tool-uuid-in-kit" />);

      await waitFor(() => {
        expect(screen.getByText("Kit Information")).toBeInTheDocument();
      });

      expect(screen.getByText("Parent Kit")).toBeInTheDocument();
      const kitLink = screen.getByRole("link", { name: "Engine Tool Kit" });
      expect(kitLink).toHaveAttribute("href", "/tool/tool-uuid-kit");
    });
  });
});
