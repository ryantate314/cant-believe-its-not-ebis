/**
 * Playwright configuration for critical path E2E tests.
 *
 * These tests require the full stack:
 * - PostgreSQL database with migrations applied
 * - FastAPI backend running on port 8000
 * - Next.js frontend running on port 3000
 *
 * Use: make ui-test-e2e-critical
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  testMatch: "critical-path.spec.ts",
  fullyParallel: false, // Run sequentially to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for database consistency
  reporter: [["html", { outputFolder: "playwright-report-critical" }], ["list"]],
  timeout: 60000, // Longer timeout for full-stack tests
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start both servers for full-stack testing
  webServer: [
    {
      command: "cd ../api && uv run fastapi dev --port 8000",
      url: "http://localhost:8000/docs",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "yarn dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
