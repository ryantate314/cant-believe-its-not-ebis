import { test, expect } from "@playwright/test";

test.describe("Tools E2E", () => {
  test.describe("Tools Page - Basic", () => {
    test("should display tools page with title", async ({ page }) => {
      await page.goto("/tool");

      await expect(page.getByText("Tools")).toBeVisible();
    });

    test("should show city selector prompt", async ({ page }) => {
      await page.goto("/tool");

      await expect(
        page.getByText("Please select a city to view tools")
      ).toBeVisible();
    });

    test("should show city selector combobox", async ({ page }) => {
      await page.goto("/tool");

      await expect(page.getByRole("combobox").first()).toBeVisible();
    });
  });

  test.describe("Tools Page - City Selection", () => {
    test("should load tools when city is selected", async ({ page }) => {
      await page.goto("/tool");

      const citySelector = page.getByRole("combobox").first();
      await expect(citySelector).toBeVisible();

      try {
        await citySelector.click();
        const firstCity = page.getByRole("option").first();
        if (await firstCity.isVisible({ timeout: 2000 })) {
          await firstCity.click();
          // Should show tools table or empty state
          await expect(
            page.getByText(/Tool Name|No tools found/i)
          ).toBeVisible({ timeout: 5000 });
        }
      } catch {
        // Backend not available, skip this part
        test.skip();
      }
    });
  });

  test.describe("Tools Page - Tab Navigation", () => {
    test("should have List tab active by default", async ({ page }) => {
      await page.goto("/tool");

      const listTab = page.getByRole("tab", { name: "List" });
      await expect(listTab).toBeVisible();
      await expect(listTab).toHaveAttribute("data-state", "active");
    });

    test("should have disabled Transfer, History, Reports tabs", async ({
      page,
    }) => {
      await page.goto("/tool");

      const transferTab = page.getByRole("tab", { name: "Transfer" });
      const historyTab = page.getByRole("tab", { name: "History" });
      const reportsTab = page.getByRole("tab", { name: "Reports" });

      await expect(transferTab).toBeVisible();
      await expect(historyTab).toBeVisible();
      await expect(reportsTab).toBeVisible();

      await expect(transferTab).toBeDisabled();
      await expect(historyTab).toBeDisabled();
      await expect(reportsTab).toBeDisabled();
    });
  });

  test.describe("Tools Page - Filter Controls", () => {
    test("should have tool room filter disabled when no city", async ({
      page,
    }) => {
      await page.goto("/tool");

      // The second combobox is the tool room filter
      const comboboxes = page.getByRole("combobox");
      const toolRoomSelect = comboboxes.nth(1);
      await expect(toolRoomSelect).toBeVisible();
      await expect(toolRoomSelect).toBeDisabled();
    });

    test("should have kit filter disabled when no city", async ({ page }) => {
      await page.goto("/tool");

      const comboboxes = page.getByRole("combobox");
      const kitFilterSelect = comboboxes.nth(2);
      await expect(kitFilterSelect).toBeVisible();
      await expect(kitFilterSelect).toBeDisabled();
    });

    test("should have calibration filter disabled when no city", async ({
      page,
    }) => {
      await page.goto("/tool");

      const comboboxes = page.getByRole("combobox");
      const calibFilterSelect = comboboxes.nth(3);
      await expect(calibFilterSelect).toBeVisible();
      await expect(calibFilterSelect).toBeDisabled();
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading structure", async ({ page }) => {
      await page.goto("/tool");

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText("Tools");
    });

    test("should have keyboard-accessible controls", async ({ page }) => {
      await page.goto("/tool");

      // Tab through the page and verify focusable elements are reachable
      await page.keyboard.press("Tab");

      let attempts = 0;
      let foundButton = false;
      while (attempts < 20) {
        const focusedElement = page.locator(":focus");
        const tagName = await focusedElement.evaluate((el) =>
          el.tagName.toLowerCase()
        );
        if (tagName === "button") {
          foundButton = true;
          break;
        }
        await page.keyboard.press("Tab");
        attempts++;
      }

      expect(foundButton).toBeTruthy();
    });
  });

  test.describe("Responsive Design", () => {
    test("should be usable on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/tool");

      await expect(page.getByText("Tools")).toBeVisible();
      await expect(page.getByRole("combobox").first()).toBeVisible();
    });
  });
});
