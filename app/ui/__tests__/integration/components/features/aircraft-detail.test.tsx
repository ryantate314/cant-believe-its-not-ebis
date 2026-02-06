import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AircraftDetail } from "@/components/features/aircraft/aircraft-detail";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

describe("AircraftDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render aircraft details correctly", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "N12345" })).toBeInTheDocument();
    });

    expect(screen.getByText("Cessna")).toBeInTheDocument();
    expect(screen.getByText("172")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("SN12345")).toBeInTheDocument();
  });

  it("should render linked customers list", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "N12345" })).toBeInTheDocument();
    });

    // Customer section should show linked customer
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("should show primary customer with badge", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "N12345" })).toBeInTheDocument();
    });

    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("should render Add Customer button", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "N12345" })).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /add customer/i })
    ).toBeInTheDocument();
  });

  it("should render Edit and Delete buttons", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "N12345" })).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Edit" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete" })
    ).toBeInTheDocument();
  });

  it("should handle aircraft not found", async () => {
    render(<AircraftDetail aircraftId="nonexistent-id" />);

    await waitFor(() => {
      expect(
        screen.getByText("Aircraft not found")
      ).toBeInTheDocument();
    });
  });

  it("should show active status badge", async () => {
    render(<AircraftDetail aircraftId="aircraft-uuid-1" />);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });
});
