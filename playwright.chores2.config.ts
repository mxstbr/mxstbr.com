import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './app/lib/chores2',
  testMatch: 'browser.spec.ts',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3022',
    viewport: { width: 1024, height: 680 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3022',
    url: 'http://127.0.0.1:3022/chores2',
    reuseExistingServer: true,
    env: { CHORES2_DEV_FIXTURE: '1' },
    timeout: 120000,
  },
})
