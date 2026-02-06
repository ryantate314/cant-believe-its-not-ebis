import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerForm } from "@/components/features/customers/customer-form";
import { mockCustomers } from "../../../mocks/data";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/customers/new",
}));

describe("CustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode", () => {
    it("should render Create Customer submit button when no customer prop", () => {
      render(<CustomerForm />);

      expect(
        screen.getByRole("button", { name: "Create Customer" })
      ).toBeInTheDocument();
    });

    it("should render empty form fields", () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText("Name *") as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });

    it("should show required indicator on Name field", () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText("Name *") as HTMLInputElement;
      expect(nameInput).toBeRequired();
    });

    it("should successfully create customer with valid data", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText("Name *");
      await user.type(nameInput, "New Test Customer");

      const submitButton = screen.getByRole("button", {
        name: "Create Customer",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/customers/")
        );
      });
    });

    it("should navigate to customer detail after creation", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText("Name *");
      await user.type(nameInput, "Another Customer");

      const submitButton = screen.getByRole("button", {
        name: "Create Customer",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/customers\/customer-uuid-/)
        );
      });
    });
  });

  describe("edit mode", () => {
    const customer = mockCustomers[0];

    it("should render Update Customer submit button when customer prop provided", () => {
      render(<CustomerForm customer={customer} />);

      expect(
        screen.getByRole("button", { name: "Update Customer" })
      ).toBeInTheDocument();
    });

    it("should pre-fill form fields from customer prop", () => {
      render(<CustomerForm customer={customer} />);

      const nameInput = screen.getByLabelText("Name *") as HTMLInputElement;
      expect(nameInput.value).toBe("Acme Corp");

      const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
      expect(emailInput.value).toBe("acme@example.com");

      const phoneInput = screen.getByLabelText("Phone") as HTMLInputElement;
      expect(phoneInput.value).toBe("555-0100");
    });

    it("should successfully update customer", async () => {
      const user = userEvent.setup();
      render(<CustomerForm customer={customer} />);

      const nameInput = screen.getByLabelText("Name *");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Acme Corp");

      const submitButton = screen.getByRole("button", {
        name: "Update Customer",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/customers/")
        );
      });
    });
  });

  describe("form fields", () => {
    it("should have all expected fields", () => {
      render(<CustomerForm />);

      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone Type")).toBeInTheDocument();
      expect(screen.getByLabelText("Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Address 2")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();
      expect(screen.getByLabelText("State")).toBeInTheDocument();
      expect(screen.getByLabelText("Zip")).toBeInTheDocument();
      expect(screen.getByLabelText("Country")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("should have Cancel button", () => {
      render(<CustomerForm />);

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    it("should navigate back on Cancel click", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should show error when name is only whitespace", async () => {
      const user = userEvent.setup();
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText("Name *");
      // Type whitespace-only name to bypass required but trigger our trim check
      await user.type(nameInput, "   ");

      const submitButton = screen.getByRole("button", {
        name: "Create Customer",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
      });
    });

    it("should have enabled submit button initially", () => {
      render(<CustomerForm />);

      const submitButton = screen.getByRole("button", {
        name: "Create Customer",
      });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
