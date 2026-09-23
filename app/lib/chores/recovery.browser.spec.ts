import { test, expect, type Page } from '@playwright/test'
import type { Board } from './types'

const endpoint = '**/api/chores/board'
const ready = (page: Page) =>
  expect(
    page.getByRole('heading', { name: 'Getting your chores…' }),
  ).toHaveCount(0)
const wake = (page: Page) =>
  page.evaluate(() => window.dispatchEvent(new Event('pageshow')))
const navigationType = (page: Page) =>
  page.evaluate(
    () =>
      (
        performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming
      ).type,
  )

async function scene(page: Page): Promise<Board> {
  const board = await (await page.request.get('/api/chores/board')).json()
  expect(board.serverNow).toBe('2026-09-09T14:15:00.000Z')
  board.revision += 1000 // Fixture reads advance revision, including the page render.
  return board
}

test('an open board loads new app code after deployment', async ({ page }) => {
  await scene(page)
  await page.goto('/chores')
  await ready(page)
  const response = await page.request.get('/api/chores/board')
  expect(response.headers()['x-chores-version']).toBeTruthy()
  expect(response.headers()['x-chores-version']).not.toBe('development')
  await page.route(
    endpoint,
    async (route) => {
      await route.fulfill({
        headers: { 'X-Chores-Version': 'next-deployment' },
        json: await response.json(),
      })
    },
    { times: 1 },
  )
  await Promise.all([page.waitForEvent('domcontentloaded'), wake(page)])
  await ready(page)
  expect(await navigationType(page)).toBe('reload')
  await expect(page.locator('.chores-connection')).toHaveCount(0)
})

for (const malformed of [false, true]) {
  test(`recovers from ${malformed ? 'invalid JSON' : 'a removed API returning HTML'} without a reload loop`, async ({
    page,
  }) => {
    await scene(page)
    await page.goto('/chores')
    await ready(page)
    let navigations = 0
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        navigations++
    })
    await page.route(endpoint, (route) =>
      route.fulfill({
        status: malformed ? 200 : 404,
        contentType: malformed ? 'application/json' : 'text/html',
        body: malformed ? '{broken' : '<html>Not found</html>',
      }),
    )
    await Promise.all([page.waitForEvent('domcontentloaded'), wake(page)])
    await expect(page.locator('.chores-connection')).toContainText(
      'Reconnecting…',
    )
    await wake(page)
    await expect(page.locator('.chores-connection')).toContainText(
      'Reconnecting…',
    )
    expect(navigations).toBe(1)
    await expect(
      page.getByText(/expected pattern|Unexpected token/),
    ).toHaveCount(0)
    await expect(page.getByText('Go play.', { exact: true })).toHaveCount(0)
    await page.unroute(endpoint)
    await wake(page)
    await ready(page)
    await expect(page.locator('.chores-connection')).toHaveCount(0)
    expect(navigations).toBe(1)
  })
}

test('a hung refresh times out and waking replaces an unfinished request', async ({
  page,
}) => {
  const board = await scene(page)
  await page.clock.install()
  await page.goto('/chores')
  await ready(page)
  let documents = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documents++
  })
  let requests = 0
  await page.route(endpoint, async (route) => {
    requests++
    if (requests < 3) return // Leave these reads pending, including through wake.
    await route.fulfill({ json: board })
  })
  await wake(page)
  await expect.poll(() => requests).toBe(1)
  await page.clock.runFor(10001)
  await expect(page.locator('.chores-connection')).toContainText(
    'Reconnecting…',
  )
  expect(documents).toBe(0)
  await wake(page)
  await expect.poll(() => requests).toBe(2)
  await wake(page)
  await ready(page)
  expect(requests).toBe(3)
  await expect(page.locator('.chores-connection')).toHaveCount(0)
})

test('morning wake replaces last night without a document refresh', async ({
  page,
}) => {
  const board = await scene(page)
  const night: Board = {
    ...board,
    day: '2026-09-09',
    period: 'night',
    serverNow: '2026-09-10T04:00:00.000Z',
    boundary: '2026-09-10T05:00:00.000Z',
  }
  const morning: Board = {
    ...board,
    day: '2026-09-10',
    period: 'morning',
    serverNow: '2026-09-10T14:00:00.000Z',
    boundary: '2026-09-10T14:30:00.000Z',
  }
  let current = night
  await page.route(endpoint, (route) => route.fulfill({ json: current }))
  await page.clock.install({ time: new Date(night.serverNow) })
  await page.goto('/chores')
  await ready(page)
  await expect(
    page.getByRole('heading', { name: 'Night', exact: true }),
  ).toBeVisible()
  let documents = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documents++
  })
  current = morning
  await page.clock.setSystemTime(new Date(morning.serverNow))
  await wake(page)
  await expect(
    page.getByRole('heading', { name: 'Morning', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chores-date')).toHaveText('Thu, Sep 10')
  await ready(page)
  expect(documents).toBe(0)
})

test('deployment recovery preserves a busy or uncertain save and its exact retry ID', async ({
  page,
}) => {
  const board = await scene(page)
  await page.route(endpoint, (route) => route.fulfill({ json: board }))
  await page.goto('/chores')
  await ready(page)
  const kid = page.locator(`[data-kid="${board.kids[0].id}"]`)
  const ids: string[] = []
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/chores/command', async (route) => {
    ids.push(route.request().postDataJSON().requestId)
    if (ids.length === 1) {
      await gate
      await route.abort('failed')
    } else {
      await route.fulfill({
        json: { board, result: { status: 'completed', message: 'Saved.' } },
      })
    }
  })
  await kid.getByRole('button', { name: /I did it!/ }).click()
  await expect.poll(() => ids.length).toBe(1)
  await page.unroute(endpoint)
  await page.route(endpoint, (route) =>
    route.fulfill({
      headers: { 'X-Chores-Version': 'next-deployment' },
      json: board,
    }),
  )
  await wake(page)
  await expect(page.locator('.chores-connection')).toContainText(
    'Finish or retry your last save',
  )
  expect(await navigationType(page)).toBe('navigate')
  release()
  await expect(kid.getByRole('button', { name: 'Retry saving' })).toBeVisible()
  await wake(page)
  await expect(page.locator('.chores-connection')).toContainText(
    'Finish or retry your last save',
  )
  expect(await navigationType(page)).toBe('navigate')
  // Keep the mismatch until the retry has been acknowledged, then permit reload.
  await page.unroute(endpoint)
  await page.route(
    endpoint,
    async (route) => {
      await route.fulfill({
        headers: { 'X-Chores-Version': 'next-deployment' },
        json: board,
      })
    },
    { times: 1 },
  )
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    kid.getByRole('button', { name: 'Retry saving' }).click(),
  ])
  expect(ids).toHaveLength(2)
  expect(ids[0]).toBe(ids[1])
  expect(await navigationType(page)).toBe('reload')
  await ready(page)
})

test('network loss retries data without reloading the app', async ({
  page,
}) => {
  await scene(page)
  await page.goto('/chores')
  await ready(page)
  await page.route(endpoint, (route) => route.abort('internetdisconnected'))
  await wake(page)
  await expect(page.locator('.chores-connection')).toContainText(
    'Reconnecting…',
  )
  expect(await navigationType(page)).toBe('navigate')
  await page.unroute(endpoint)
  await wake(page)
  await ready(page)
  await expect(page.locator('.chores-connection')).toHaveCount(0)
})
