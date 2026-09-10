import { defineConfig } from '@playwright/test'

const login = process.env.CHORES2_LOGIN_TEST === '1'
export default defineConfig({
  testDir: './app/lib/chores2',
  testMatch: login ? 'login.browser.spec.ts' : 'browser.spec.ts',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3022',
    viewport: { width: 1024, height: 680 },
    // Login tests use the existing private site credential.
    trace: login ? 'off' : 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3022',
    url: 'http://127.0.0.1:3022/chores2',
    reuseExistingServer: true,
    env: { CHORES2_DEV_FIXTURE: login ? '0' : '1' },
    timeout: 120000,
  },
})
