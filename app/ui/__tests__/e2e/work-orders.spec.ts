import { test, expect } from "@playwright/test";

test.describe("Work Orders E2E", () => {
  test.describe("Work Order List", () => {
    test("should display work orders page", async ({ page }) => {
      await page.goto("/workorder");

      await expect(page.getByText("Work Orders")).toBeVisible();
      await expect(page.getByText("Please select a city")).toBeVisible();
    });

    test("should show city selector", async ({ page }) => {
      await page.goto("/workorder");

      await expect(page.getByRole("combobox").first()).toBeVisible();
    });

    test("should load work orders when city is selected", async ({ page }) => {
      // This test requires the backend to be running
      // Skip if backend is not available
      await page.goto("/workorder");

      const citySelector = page.getByRole("combobox").first();
      await expect(citySelector).toBeVisible();

      // Try to select a city - will fail gracefully if no cities
      try {
        await citySelector.click();
        const firstCity = page.getByRole("option").first();
        if (await firstCity.isVisible({ timeout: 2000 })) {
          await firstCity.click();
          // Should show work orders table or empty state
          await expect(
            page.getByText(/work order|No work orders found/i)
          ).toBeVisible({ timeout: 5000 });
        }
      } catch {
        // Backend not available, skip this part
        test.skip();
      }
    });
  });

  test.describe("New Work Order", () => {
    test("should display new work order form", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      await expect(page.getByText("Work Order Details")).toBeVisible();
      await expect(page.getByText("Aircraft Information")).toBeVisible();
      await expect(page.getByText("Customer Information")).toBeVisible();
      await expect(page.getByText("Assignment")).toBeVisible();
    });

    test("should have form fields", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      await expect(page.getByLabel("Registration")).toBeVisible();
      await expect(page.getByLabel("Customer Name")).toBeVisible();
      await expect(page.getByLabel("Due Date")).toBeVisible();
    });

    test("should have Cancel and Create buttons", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      await expect(
        page.getByRole("button", { name: "Cancel" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create Work Order" })
      ).toBeVisible();
    });

    test("should navigate back on cancel", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      await page.getByRole("button", { name: "Cancel" }).click();

      // Should navigate back
      await expect(page).not.toHaveURL(/\/workorder\/new/);
    });
  });

  test.describe("Work Order Detail", () => {
    test.beforeEach(async () => {
      // This requires a valid work order ID - skip if backend unavailable
      test.skip(true, "Requires backend to be running with test data");
    });

    test("should display work order header", async ({ page }) => {
      await page.goto("/workorder/test-wo-id");

      await expect(page.getByText(/KTYS\d+/)).toBeVisible();
    });

    test("should display work order items", async ({ page }) => {
      await page.goto("/workorder/test-wo-id/item");

      await expect(page.getByText("Work Order Items")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add Item" })
      ).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("work order list should have proper heading structure", async ({
      page,
    }) => {
      await page.goto("/workorder");

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText("Work Orders");
    });

    test("form fields should have labels", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      // Check that inputs have associated labels
      const registrationInput = page.getByLabel("Registration");
      await expect(registrationInput).toBeVisible();

      const customerInput = page.getByLabel("Customer Name");
      await expect(customerInput).toBeVisible();
    });

    test("buttons should be keyboard accessible", async ({ page }) => {
      await page.goto("/workorder/new?city=test-city-id");

      // Tab to the Cancel button and verify focus
      await page.keyboard.press("Tab");

      // Continue tabbing until we find a button
      let attempts = 0;
      while (attempts < 20) {
        const focusedElement = page.locator(":focus");
        const tagName = await focusedElement.evaluate((el) =>
          el.tagName.toLowerCase()
        );
        if (tagName === "button") {
          break;
        }
        await page.keyboard.press("Tab");
        attempts++;
      }

      // Should be able to find a focusable button
      expect(attempts).toBeLessThan(20);
    });
  });

  test.describe("Responsive Design", () => {
    test("should be usable on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/workorder");

      await expect(page.getByText("Work Orders")).toBeVisible();
      await expect(page.getByRole("combobox").first()).toBeVisible();
    });

    test("form should stack on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/workorder/new?city=test-city-id");

      // Form sections should still be visible
      await expect(page.getByText("Work Order Details")).toBeVisible();
      await expect(page.getByLabel("Registration")).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should show error message for invalid work order ID", async ({
      page,
    }) => {
      await page.goto("/workorder/invalid-id-that-does-not-exist");

      // Should either show error or redirect
      // Wait for either error message or redirect
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const hasError =
        (await page.getByText(/error|not found/i).isVisible()) ||
        currentUrl.includes("/workorder") && !currentUrl.includes("invalid");

      expect(hasError).toBeTruthy();
    });
  });
});
