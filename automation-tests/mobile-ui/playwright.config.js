import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MOBILE_UI_BASE_URL || 'http://localhost:8083';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '../reports/ui-html', open: 'never' }],
    ['junit', { outputFile: '../reports/ui-junit.xml' }],
  ],
});
