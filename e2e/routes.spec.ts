import { test, expect, type Page, type TestInfo } from '@playwright/test'

const CAL_PASSWORD = process.env.CAL_PASSWORD || 'test-password'

async function expectPageOk(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'networkidle' })
  expect(response, `Expected a response for ${path}`).toBeTruthy()
  expect(response!.ok(), `Expected ${path} to load successfully`).toBeTruthy()
  await expect(page.locator('body')).toBeVisible()
  await expect(page.getByText('This page could not be found').first()).toHaveCount(0)
}

test.describe('Public pages render', () => {
  const publicRoutes = [
    '/',
    '/investing',
    '/readme',
    '/notes',
    '/oss',
    '/todos',
    '/thoughts/gatsby',
    '/thoughts/tech-choice-regrets-at-spectrum',
    '/thoughts/margin',
    '/thoughts/graphql',
    '/thoughts/streaming-ssr',
    '/thoughts/css-in-js',
    '/thoughts/tailwind',
    '/clippy',
  ]

  for (const path of publicRoutes) {
    test(`renders ${path}`, async ({ page }) => {
      await expectPageOk(page, path)
    })
  }

  test('renders all note detail and topic pages', async ({ page }) => {
    await expectPageOk(page, '/notes')

    const { notePaths, topicPaths } = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href^="/notes/"]'),
      )

      const notePaths = new Set<string>()
      const topicPaths = new Set<string>()

      for (const anchor of anchors) {
        const href = anchor.pathname

        if (href === '/notes') continue
        if (href.includes('/topics/')) {
          topicPaths.add(href)
        } else {
          notePaths.add(href)
        }
      }

      return {
        notePaths: Array.from(notePaths),
        topicPaths: Array.from(topicPaths),
      }
    })

    test.skip(notePaths.length === 0, 'No notes available to test detail pages')
    test.skip(topicPaths.length === 0, 'No note topics available to test topic routes')

    for (const path of notePaths) {
      await expectPageOk(page, path)
    }

    for (const path of topicPaths) {
      await expectPageOk(page, path)
    }
  })
})

test.describe('Personal pages require the password', () => {
  async function addPasswordCookie(page: Page, testInfo: TestInfo) {
    const baseURL = testInfo.project.use.baseURL || 'http://127.0.0.1:3000'

    await page.context().addCookies([
      { name: 'password', value: CAL_PASSWORD, url: baseURL },
    ])
  }

  const personalRoutes = [
    '/cal',
    '/cal/debug',
    '/chores',
    '/chores/rewards',
    '/chores/admin',
    '/finance',
    '/reminder',
    '/stats',
  ]

  for (const path of personalRoutes) {
    test(`${path} renders with the password`, async ({ page }, testInfo) => {
      await addPasswordCookie(page, testInfo)

      await expectPageOk(page, path)
    })

    test(`${path} rejects requests without the password`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'networkidle' })

      if (response && response.status() >= 400) {
        expect(response.status()).toBeGreaterThanOrEqual(400)
        return
      }

      await expect(page.getByLabel(/password/i).first()).toBeVisible()
    })
  }

  test('/os renders once authenticated', async ({ page }, testInfo) => {
    await addPasswordCookie(page, testInfo)

    await expectPageOk(page, '/os')

    const authStatus = await page.evaluate(async () => {
      const res = await fetch('/api/auth')
      return res.text()
    })

    expect(authStatus).toBe('true')
  })

  test('/os shows unauthenticated state without the password', async ({ page }) => {
    const response = await page.goto('/os', { waitUntil: 'networkidle' })
    expect(response?.ok()).toBeTruthy()

    const authStatus = await page.evaluate(async () => {
      const res = await fetch('/api/auth')
      return res.text()
    })

    expect(authStatus).toBe('false')
  })
})
