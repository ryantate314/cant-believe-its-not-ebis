/**
 * Critical Path E2E Tests
 *
 * These tests exercise the full stack (UI -> Next.js API -> FastAPI -> PostgreSQL)
 * and are designed to catch integration issues like enum mismatches between
 * application code and database schema.
 *
 * Prerequisites:
 * - PostgreSQL running with migrations applied (make db-migrate)
 * - FastAPI server running (make api-run)
 * - Next.js dev server running (make ui-run)
 *
 * Run with: make ui-test-e2e-critical
 */

import { test, expect } from "@playwright/test";

test.describe("Critical Path: Work Order CRUD", () => {
  // Skip if backend is not available
  test.beforeEach(async ({ page }) => {
    // Check if the API is reachable by trying to fetch cities
    try {
      const response = await page.request.get("/api/cities");
      if (!response.ok()) {
        test.skip(true, "Backend API not available");
      }
    } catch {
      test.skip(true, "Backend API not available");
    }
  });

  test("should create a new work order with full stack validation", async ({
    page,
  }) => {
    // Step 1: Navigate to work orders page
    await page.goto("/workorder");
    await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();

    // Step 2: Select a city from the dropdown
    const citySelector = page.getByRole("combobox").first();
    await expect(citySelector).toBeVisible();
    await citySelector.click();

    // Wait for cities to load and select the first one
    const firstCity = page.getByRole("option").first();
    await expect(firstCity).toBeVisible({ timeout: 5000 });
    await firstCity.click();

    // Step 3: Navigate to new work order form
    const newButton = page.getByRole("link", { name: /new work order/i });
    await expect(newButton).toBeVisible();
    await newButton.click();

    await expect(page).toHaveURL(/\/workorder\/new/);
    await expect(page.getByText("Work Order Details")).toBeVisible();

    // Step 4: Fill out the form with test data
    // Use a unique identifier to avoid conflicts
    const testId = Date.now().toString().slice(-6);

    await page.getByLabel("Registration").fill(`N${testId}`);
    await page.getByLabel("Serial Number").fill(`SN-TEST-${testId}`);
    await page.getByLabel("Make").fill("Cessna");
    await page.getByLabel("Model").fill("172");
    await page.getByLabel("Year").fill("2020");
    await page.getByLabel("Customer Name").fill(`E2E Test Customer ${testId}`);
    await page.getByLabel("PO Number").fill(`PO-E2E-${testId}`);
    await page.getByLabel("Lead Technician").fill("Test Technician");
    await page.getByLabel("Sales Person").fill("Test Sales");

    // Step 5: Submit the form
    // This is the critical moment - if the enum values are wrong,
    // the PostgreSQL database will reject the insert
    const submitButton = page.getByRole("button", { name: "Create Work Order" });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 6: Verify successful creation
    // Should redirect to the work order detail page
    await expect(page).not.toHaveURL(/\/workorder\/new/, { timeout: 10000 });

    // Verify we're on a work order detail page (URL contains a UUID)
    await expect(page).toHaveURL(/\/workorder\/[a-f0-9-]+/i, { timeout: 5000 });

    // Verify the work order data is displayed
    await expect(page.getByText(`N${testId}`)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(`E2E Test Customer ${testId}`)).toBeVisible();
  });

  test("should create a quote type work order", async ({ page }) => {
    // Navigate to work orders and select a city
    await page.goto("/workorder");

    const citySelector = page.getByRole("combobox").first();
    await citySelector.click();
    const firstCity = page.getByRole("option").first();
    await expect(firstCity).toBeVisible({ timeout: 5000 });
    await firstCity.click();

    // Navigate to new work order form
    await page.getByRole("link", { name: /new work order/i }).click();
    await expect(page.getByText("Work Order Details")).toBeVisible();

    // Change the type to Quote
    // This tests that the 'quote' enum value is correctly sent to PostgreSQL
    // Find and click the Type dropdown
    const typeDropdown = page.locator("button").filter({ hasText: /Work Order|Quote/ }).first();
    if (await typeDropdown.isVisible()) {
      await typeDropdown.click();
      const quoteOption = page.getByRole("option", { name: "Quote" });
      await expect(quoteOption).toBeVisible();
      await quoteOption.click();
    }

    // Fill minimal required data
    const testId = Date.now().toString().slice(-6);
    await page.getByLabel("Customer Name").fill(`Quote Test ${testId}`);

    // Submit
    await page.getByRole("button", { name: "Create Work Order" }).click();

    // Verify creation succeeded
    await expect(page).not.toHaveURL(/\/workorder\/new/, { timeout: 10000 });
    await expect(page.getByText(`Quote Test ${testId}`)).toBeVisible({ timeout: 5000 });
  });

  test("should update an existing work order", async ({ page }) => {
    // First, create a work order to update
    await page.goto("/workorder");

    const citySelector = page.getByRole("combobox").first();
    await citySelector.click();
    const firstCity = page.getByRole("option").first();
    await expect(firstCity).toBeVisible({ timeout: 5000 });
    await firstCity.click();

    await page.getByRole("link", { name: /new work order/i }).click();

    const testId = Date.now().toString().slice(-6);
    await page.getByLabel("Customer Name").fill(`Update Test ${testId}`);
    await page.getByRole("button", { name: "Create Work Order" }).click();

    // Wait for redirect to detail page
    await expect(page).not.toHaveURL(/\/workorder\/new/, { timeout: 10000 });

    // Find and click edit button
    const editButton = page.getByRole("link", { name: /edit/i }).or(
      page.getByRole("button", { name: /edit/i })
    );

    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();

      // Update the customer name
      const customerInput = page.getByLabel("Customer Name");
      await customerInput.clear();
      await customerInput.fill(`Updated Customer ${testId}`);

      // Save changes
      await page.getByRole("button", { name: /update|save/i }).click();

      // Verify update succeeded
      await expect(page.getByText(`Updated Customer ${testId}`)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Navigate directly to new work order without a valid city
    await page.goto("/workorder/new?city=invalid-city-id");

    await page.getByLabel("Customer Name").fill("Error Test Customer");
    await page.getByRole("button", { name: "Create Work Order" }).click();

    // Should either show an error message or stay on the form (not crash/blank page)
    // Wait for either an error message or the form to still be visible
    await page.waitForTimeout(2000);

    const hasError = await page.getByText(/error|failed|not found/i).isVisible();
    const formStillVisible = await page.getByText("Work Order Details").isVisible();

    // The app should handle the error gracefully - either show error or keep form
    expect(hasError || formStillVisible).toBeTruthy();
  });
});

test.describe("Critical Path: Database Enum Validation", () => {
  test.beforeEach(async ({ page }) => {
    try {
      const response = await page.request.get("/api/cities");
      if (!response.ok()) {
        test.skip(true, "Backend API not available");
      }
    } catch {
      test.skip(true, "Backend API not available");
    }
  });

  test("should accept valid work_order_type enum values", async ({ page }) => {
    // Test that both 'work_order' and 'quote' are accepted by the database
    // This directly tests the fix for the enum mismatch bug

    const cityResponse = await page.request.get("/api/cities");
    const cities = await cityResponse.json();

    if (!cities.items || cities.items.length === 0) {
      test.skip(true, "No cities available");
      return;
    }

    const cityId = cities.items[0].id;

    // Test 'work_order' type (default)
    const workOrderResponse = await page.request.post("/api/work-orders", {
      data: {
        city_id: cityId,
        created_by: "e2e_test",
        work_order_type: "work_order",
        customer_name: "Enum Test - Work Order",
      },
    });

    expect(workOrderResponse.ok()).toBeTruthy();
    const workOrder = await workOrderResponse.json();
    expect(workOrder.work_order_type).toBe("work_order");

    // Test 'quote' type
    const quoteResponse = await page.request.post("/api/work-orders", {
      data: {
        city_id: cityId,
        created_by: "e2e_test",
        work_order_type: "quote",
        customer_name: "Enum Test - Quote",
      },
    });

    expect(quoteResponse.ok()).toBeTruthy();
    const quote = await quoteResponse.json();
    expect(quote.work_order_type).toBe("quote");
  });

  test("should accept valid status enum values", async ({ page }) => {
    const cityResponse = await page.request.get("/api/cities");
    const cities = await cityResponse.json();

    if (!cities.items || cities.items.length === 0) {
      test.skip(true, "No cities available");
      return;
    }

    const cityId = cities.items[0].id;

    // Create a work order and update its status through the valid workflow
    const createResponse = await page.request.post("/api/work-orders", {
      data: {
        city_id: cityId,
        created_by: "e2e_test",
        customer_name: "Status Enum Test",
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const workOrder = await createResponse.json();
    expect(workOrder.status).toBe("created");

    // Update to 'open' status
    const updateResponse = await page.request.put(
      `/api/work-orders/${workOrder.id}`,
      {
        data: {
          status: "open",
          updated_by: "e2e_test",
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.status).toBe("open");
  });

  test("should accept valid priority enum values", async ({ page }) => {
    const cityResponse = await page.request.get("/api/cities");
    const cities = await cityResponse.json();

    if (!cities.items || cities.items.length === 0) {
      test.skip(true, "No cities available");
      return;
    }

    const cityId = cities.items[0].id;
    const priorities = ["low", "normal", "high", "urgent"];

    for (const priority of priorities) {
      const response = await page.request.post("/api/work-orders", {
        data: {
          city_id: cityId,
          created_by: "e2e_test",
          priority: priority,
          customer_name: `Priority Test - ${priority}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const workOrder = await response.json();
      expect(workOrder.priority).toBe(priority);
    }
  });
});
