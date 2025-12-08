import { defineConfig } from '@playwright/test'

const port = process.env.PORT || 3000
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`
const calPassword = process.env.CAL_PASSWORD || 'test-password'

process.env.CAL_PASSWORD = calPassword

export default defineConfig({
  testDir: './e2e',
  timeout: 120 * 1000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm dev --hostname 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      CAL_PASSWORD: calPassword,
    },
  },
})
