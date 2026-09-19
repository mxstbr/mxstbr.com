import { test, expect } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())
const password = process.env.CAL_PASSWORD
const base = 'http://127.0.0.1:3022'

test.beforeEach(async ({ page }) => {
  expect(Boolean(password)).toBe(true)
  // This suite exercises real auth and reads the independent v2 board only.
  // Refuse to run against the development fixture's auth bypass.
  expect((await page.request.get('/api/chores2/board')).status()).toBe(401)
})

test('an existing OS login opens the board and APIs with kid-only permissions', async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: 'password', value: password!, url: base }])
  await page.goto('/chores')
  await expect(page.locator('.c2-child')).toHaveCount(3)
  await expect(page.getByLabel('Site password')).toHaveCount(0)
  expect((await page.request.get('/api/chores2/board')).status()).toBe(200)
  expect(
    (await context.cookies()).some((c) => c.name === 'chores2-device'),
  ).toBe(false)
  const denied = await page.request.post('/api/chores2/command', {
    headers: { Origin: base },
    data: {
      requestId: 'login-parent-command-denied',
      command: {
        action: 'adjust_stars',
        kidId: 'kid-1',
        delta: 1,
        note: 'This must be rejected',
      },
    },
  })
  expect(denied.status()).toBe(403)
  await context.addCookies([
    { name: 'chores2-device', value: 'a'.repeat(64), url: base },
  ])
  await page.reload()
  await expect(page.locator('.c2-child')).toHaveCount(3)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
})

test('an iPad without a login can enter the existing password and remain signed in', async ({
  page,
  context,
}) => {
  await page.goto('/chores')
  await expect(
    page.getByRole('heading', { name: 'Your chore board' }),
  ).toBeVisible()
  await expect(
    page.getByText('Use the same password as the original chore board.'),
  ).toBeVisible()
  await page.screenshot({ path: '/private/tmp/chores2-login.png' })
  await page.getByLabel('Site password').fill('wrong-password-for-verification')
  await page.getByRole('button', { name: 'Open chore board' }).click()
  await expect(page.locator('.c2-login').getByRole('alert')).toContainText(
    'That password isn’t right.',
  )
  expect((await context.cookies()).some((c) => c.name === 'password')).toBe(
    false,
  )
  await page.getByLabel('Site password').fill(password!)
  await page.getByRole('button', { name: 'Open chore board' }).click()
  await expect(page.locator('.c2-child')).toHaveCount(3)
  const cookie = (await context.cookies()).find((c) => c.name === 'password')
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.path).toBe('/')
  await page.reload()
  await expect(page.locator('.c2-child')).toHaveCount(3)
  await context.clearCookies()
  await page.reload()
  await expect(page.getByLabel('Site password')).toBeVisible()
})

test('wrong cookies and cross-origin login requests grant no access', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'password', value: 'invalid-existing-login', url: base },
  ])
  await page.goto('/chores')
  await expect(page.getByLabel('Site password')).toBeVisible()
  expect((await page.request.get('/api/chores2/board')).status()).toBe(401)
  const denied = await page.request.post('/api/chores2/login', {
    headers: { Origin: 'https://another-origin.example' },
    data: { password },
  })
  expect(denied.status()).toBe(403)
  expect((await page.request.get('/api/chores2/board')).status()).toBe(401)
  const missing = await page.request.post('/api/chores2/login', {
    headers: { Origin: base },
    data: {},
  })
  expect(missing.status()).toBe(403)
})

test('the old board and its navigation live entirely at /chores2', async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: 'password', value: password!, url: base }])
  await page.goto('/chores2')
  await expect(page.locator('.c2-child')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Chores', exact: true }),
  ).toHaveAttribute('href', '/chores2')
  await expect(
    page.getByRole('link', { name: 'Rewards', exact: true }),
  ).toHaveAttribute('href', '/chores2/rewards')
  await page.getByRole('link', { name: 'Rewards', exact: true }).click()
  await expect(page).toHaveURL(`${base}/chores2/rewards`)
  await page.getByRole('link', { name: 'Packing', exact: true }).click()
  await expect(page).toHaveURL(`${base}/chores2/packing`)
  await page.getByRole('link', { name: 'Chores', exact: true }).click()
  await expect(page).toHaveURL(`${base}/chores2`)
})
