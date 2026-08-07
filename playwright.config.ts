import { defineConfig, devices } from '@playwright/test';

/**
 * Central Playwright configuration for both the E2E (UI) suite and the API suite.
 * Two logical projects are defined so each can be run independently in CI:
 *   npm run test:e2e   -> UI tests against Sauce Demo
 *   npm run test:api   -> API tests against DummyJSON
 */
export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  projects: [
    {
      name: 'e2e',
      testDir: './e2e/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'api',
      testDir: './api/tests',
      use: {
        baseURL: 'https://dummyjson.com',
      },
    },
  ],
});
