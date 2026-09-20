import { test, expect } from '@playwright/test'
import type { Board } from './types'

test('idle panels and display wake return to now', async ({ page }) => {
  await page.clock.install()
  await page.goto('/chores')
  const board = await (await page.request.get('/api/chores2/board')).json()
  expect(board.serverNow).toBe('2026-09-09T15:00:00.000Z')
  const dilan = page.locator('[data-kid="kid-1"]')
  await dilan.locator('.c2-wallet').click()
  await expect(
    dilan.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toBeVisible()
  await page.clock.fastForward(91000)
  await expect(
    dilan.getByRole('heading', { name: 'Make your bed' }),
  ).toBeVisible()
  const views = page.getByRole('navigation', { name: 'Board views' })
  await views.getByRole('button', { name: 'Rewards', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toHaveCount(3)
  await page.clock.fastForward(60000)
  await dilan.getByRole('button', { name: /Choose a movie/ }).click()
  await page.clock.fastForward(60000)
  await expect(
    views.getByRole('button', { name: 'Rewards', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.clock.fastForward(31000)
  await expect(
    page.getByRole('heading', { name: 'Make your bed' }),
  ).toHaveCount(3)
  await expect(
    views.getByRole('button', { name: 'Chores', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.clock.fastForward(301000)
  const sleep = page.getByRole('button', { name: 'Tap to wake up' })
  await expect(sleep).toBeVisible()
  await expect(sleep).toBeEmpty()
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const element of [sleep, page.locator('html'), page.locator('body')])
      await expect(element).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    expect(await sleep.boundingBox()).toEqual({
      x: 0,
      y: 0,
      width: 1024,
      height: 680,
    })
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#000000',
    )
  }
  await sleep.focus()
  await expect(sleep).toHaveCSS('outline-style', 'none')
  await page.screenshot({
    path: '/private/tmp/chores-blackout.png',
    style: 'nextjs-portal { visibility: hidden; }',
  })
  await sleep.click()
  await expect(sleep).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/c2-asleep/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#fff8e8',
  )
  await expect(
    dilan.getByRole('heading', { name: 'Make your bed' }),
  ).toBeVisible()
})

test('landscape iPad: focus, stars, exact undo, rewards, packing, color, summary, retries and expiry', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/chores')
  const initial = await (await page.request.get('/api/chores2/board')).json()
  // This suite must never mutate a live board.
  expect(initial.serverNow).toBe('2026-09-09T15:00:00.000Z')
  const devina = page.locator('[data-kid="kid-3"]')
  const dilan = page.locator('[data-kid="kid-1"]')
  await expect(
    page.getByRole('heading', { name: 'Morning', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.c2-child')).toHaveCount(3)
  await expect(
    page.getByText('Bring your lunch bag to the kitchen'),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)

  await expect(
    page.getByRole('button', { name: 'Choose another', exact: true }),
  ).toHaveCount(0)
  await dilan.locator('.c2-period-reward').click()
  await expect(
    dilan.getByRole('heading', { name: 'For right now' }),
  ).toBeVisible()
  await expect(
    dilan.getByText('Bring your lunch bag to the kitchen'),
  ).toHaveCount(0)
  await dilan
    .getByRole('button', { name: /Brush your teeth and your tongue/ })
    .click()
  await expect(
    dilan.getByRole('heading', { name: 'Brush your teeth and your tongue' }),
  ).toBeVisible()
  await dilan.locator('.c2-period-reward').click()
  await dilan.getByRole('button', { name: /Make your bed/ }).click()
  await expect(
    dilan.getByRole('heading', { name: 'Make your bed' }),
  ).toBeVisible()

  // Reset only this local fixture's two test completions, through the actual UI.
  await devina.getByRole('button', { name: /^Done/ }).click()
  while (
    await devina.getByRole('button', { name: 'Undo', exact: true }).count()
  ) {
    await devina
      .getByRole('button', { name: 'Undo', exact: true })
      .first()
      .click()
    await devina.getByRole('button', { name: /^Done/ }).click()
  }
  await devina.getByRole('button', { name: 'Back', exact: true }).click()
  const balance = Number(
    (await devina.locator('.c2-wallet').innerText()).split(' ')[0],
  )
  const siblingWallet = await dilan.locator('.c2-wallet').innerText()
  await expect(
    devina.getByRole('heading', { name: 'Make your bed' }),
  ).toBeVisible()
  await expect(devina.locator('.c2-task-emoji')).toHaveText('🛏️')
  await devina.getByRole('button', { name: /I did it!/ }).click()
  await expect(
    devina.getByRole('heading', { name: 'Brush your teeth and your tongue' }),
  ).toBeVisible()
  await devina.getByRole('button', { name: /I did it!/ }).click()
  await expect(
    devina.getByRole('heading', { name: 'All done for now.' }),
  ).toBeVisible()
  await expect(devina).toHaveAttribute('data-attention', 'clear')
  await expect(dilan).toHaveAttribute('data-attention', 'needed')
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance + 4} ★`)
  await expect(devina.getByText('Bonus earned!')).toBeVisible()
  await expect(dilan.locator('.c2-wallet')).toHaveText(siblingWallet)
  await devina.getByRole('button', { name: /^Done/ }).click()
  await expect(devina.getByRole('button', { name: /Hear/ })).toHaveCount(0)
  await devina
    .getByRole('button', { name: 'Undo', exact: true })
    .first()
    .click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance + 1} ★`)
  await expect(devina).toHaveAttribute('data-attention', 'needed')
  await devina.getByRole('button', { name: /I did it!/ }).click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance + 4} ★`)

  const views = page.getByRole('navigation', { name: 'Board views' })
  await views.getByRole('button', { name: 'Rewards', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toHaveCount(3)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `/private/tmp/chores-rewards-${colorScheme}.png`,
    })
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await devina.getByRole('button', { name: /Choose a movie/ }).click()
  await expect(
    dilan.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toBeVisible()
  await devina.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(
    devina.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toBeVisible()
  await devina.getByRole('button', { name: /Choose a movie/ }).click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance + 4} ★`)
  await devina.getByRole('button', { name: 'Keep my stars' }).click()
  await devina.getByRole('button', { name: /A small LEGO set/ }).click()
  await expect(
    devina.getByRole('button', { name: 'Get this reward' }),
  ).toBeDisabled()
  await devina.getByRole('button', { name: 'Keep my stars' }).click()
  await devina.getByRole('button', { name: /Choose a movie/ }).click()
  await devina.getByRole('button', { name: 'Get this reward' }).click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance - 16} ★`)
  await expect(
    devina.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toBeVisible()
  await expect(dilan.locator('.c2-wallet')).toHaveText(siblingWallet)
  await views.getByRole('button', { name: 'Chores', exact: true }).click()

  await page.getByRole('button', { name: '🎒 Packing', exact: true }).click()
  await expect(devina.getByRole('checkbox')).toHaveCount(14)
  await devina.getByRole('button', { name: 'All packed', exact: true }).click()
  await expect(devina.getByText('14 of 14 packed')).toBeVisible()
  await expect(dilan.getByText('0 of 14 packed')).toBeVisible()
  await devina.getByRole('button', { name: 'New trip for everyone' }).click()
  await devina.getByRole('button', { name: 'Keep our progress' }).click()
  await expect(devina.getByText('14 of 14 packed')).toBeVisible()
  await devina.getByRole('button', { name: 'Clear mine' }).click()
  await expect(devina.getByText('0 of 14 packed')).toBeVisible()
  await devina.getByRole('button', { name: 'Back', exact: true }).click()

  await devina.locator('.c2-name').click()
  await devina.getByRole('button', { name: 'Choose #23844e' }).click()
  await devina.getByRole('button', { name: 'Cancel', exact: true }).click()
  await devina.locator('.c2-name').click()
  await expect(
    devina.getByRole('button', { name: 'Choose #9250b3' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await devina.getByRole('button', { name: 'Choose #23844e' }).click()
  await devina.getByRole('button', { name: 'Save my color' }).click()
  await devina.locator('.c2-name').click()
  await expect(
    devina.getByRole('button', { name: 'Choose #23844e' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await devina.getByRole('button', { name: 'Choose #9250b3' }).click()
  await devina.getByRole('button', { name: 'Save my color' }).click()
  await devina.locator('.c2-period-reward').click()
  await devina.getByRole('button', { name: 'My progress', exact: true }).click()
  await devina.getByRole('button', { name: 'Next day' }).click()
  await expect(devina.getByText('Scheduled tasks')).toBeVisible()
  await expect(devina.getByText('Change into your pyjama')).toHaveCount(0)
  await devina.getByRole('button', { name: 'Back to today' }).click()
  await expect(devina.getByText('Required tasks completed')).toBeVisible()
  await expect(devina.getByText('+2 ★ per period')).toBeVisible()
  await expect(page.getByText(/Daily bonus|\+10/)).toHaveCount(0)
  await devina.getByRole('button', { name: 'Back', exact: true }).click()

  // Lose the response after the server committed. Retry must reuse the ID.
  const ids: string[] = []
  await page.route('**/api/chores2/command', async (route) => {
    ids.push(route.request().postDataJSON().requestId)
    if (ids.length === 1) {
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await devina
    .getByRole('button', { name: 'Bonus chores', exact: true })
    .click()
  await devina.getByRole('button', { name: /Do six pull-ups/ }).click()
  await devina.getByRole('button', { name: /I did it!/ }).click()
  await devina.getByRole('button', { name: 'Retry saving' }).click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance - 15} ★`)
  expect(ids).toHaveLength(2)
  expect(ids[0]).toBe(ids[1])
  await page.unroute('**/api/chores2/command')
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.screenshot({ path: '/private/tmp/chores2-dark.png' })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.screenshot({ path: '/private/tmp/chores2-verified.png' })

  // Simulate a response from before the deadline arriving after the deadline.
  await dilan.getByRole('button', { name: 'Back', exact: true }).click()
  const late = {
    ...initial,
    revision: 999999,
    boundary: '2026-09-09T15:00:00.100Z',
  }
  await page.route('**/api/chores2/board', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill({ json: late })
  })
  await page.getByRole('button', { name: 'Refresh the board' }).click()
  await expect(
    dilan.getByRole('heading', { name: 'Getting your chores…' }),
  ).toBeVisible()
  await expect(dilan.getByRole('button', { name: /I did it!/ })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('a glance separates outstanding chores from empty, finished and pending work without a false all-clear', async ({
  page,
}) => {
  const scene: Board = await (
    await page.request.get('/api/chores2/board')
  ).json()
  expect(scene.serverNow).toBe('2026-09-09T15:00:00.000Z')
  scene.revision += 100
  const empty = scene.kids[1],
    done = scene.kids[2]
  empty.chores = []
  empty.completed = []
  empty.periodProgress = {
    total: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    stars: 2,
    earned: false,
  }
  done.chores = []
  done.periodProgress = {
    total: 2,
    completed: 2,
    pending: 0,
    missed: 0,
    stars: 2,
    earned: true,
  }
  await page.route('**/api/chores2/board', (route) =>
    route.fulfill({ json: scene }),
  )
  await page.goto('/chores')
  const dilan = page.locator('[data-kid="kid-1"]')
  const darian = page.locator('[data-kid="kid-2"]')
  const devina = page.locator('[data-kid="kid-3"]')
  await expect(dilan).toHaveAttribute('data-attention', 'needed')
  await expect(
    darian.getByRole('heading', { name: 'Nothing to do right now.' }),
  ).toBeVisible()
  await expect(
    devina.getByRole('heading', { name: 'All done for now.' }),
  ).toBeVisible()
  await expect(page.getByText('Go play.', { exact: true })).toHaveCount(2)
  await expect(page.locator('[data-attention="clear"]')).toHaveCount(2)
  await expect(darian.locator('.c2-primary')).toHaveCount(0)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    const background = (selector: string) =>
      page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await background('[data-kid="kid-1"]')).not.toBe(
      await background('[data-kid="kid-2"]'),
    )
    expect(await background('[data-kid="kid-2"]')).toBe(
      await background('[data-kid="kid-3"]'),
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true)
    await page.screenshot({ path: `/private/tmp/chores-glance-${scheme}.png` })
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await darian
    .getByRole('button', { name: 'Bonus chores', exact: true })
    .click()
  await expect(darian).toHaveAttribute('data-attention', 'clear')
  await darian.getByRole('button', { name: /Do six pull-ups/ }).click()
  await expect(darian).toHaveAttribute('data-attention', 'needed')
  await darian.getByRole('button', { name: 'Back to my chores' }).click()
  await expect(darian).toHaveAttribute('data-attention', 'clear')

  done.periodProgress = {
    ...done.periodProgress,
    completed: 0,
    pending: 2,
    earned: false,
  }
  scene.revision++
  await page.getByRole('button', { name: 'Refresh the board' }).click()
  await expect(
    devina.getByRole('heading', { name: 'Your part is done.' }),
  ).toBeVisible()
  await expect(devina.getByText('2 waiting for a parent.')).toBeVisible()
  await expect(devina).toHaveAttribute('data-attention', 'clear')
  await page.screenshot({ path: '/private/tmp/chores-glance-pending.png' })

  // An uncertain save must still demand attention, even if a later read shows
  // no remaining chore. This response is intercepted and never mutates data.
  await page.route('**/api/chores2/command', (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: 'Could not confirm the save.' } },
    }),
  )
  await dilan.getByRole('button', { name: /I did it!/ }).click()
  await expect(
    dilan.getByRole('button', { name: 'Retry saving' }),
  ).toBeVisible()
  scene.kids[0].chores = []
  scene.revision++
  // A background refresh preserves the uncertain save; a full page reload does not.
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(
    dilan.getByRole('heading', { name: 'Check your last chore.' }),
  ).toBeVisible()
  await expect(dilan).toHaveAttribute('data-attention', 'checking')
  await expect(dilan.getByText('Go play.', { exact: true })).toHaveCount(0)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.locator('[data-attention="clear"]')).toHaveCount(0)
  await expect(page.getByText('Go play.', { exact: true })).toHaveCount(0)
})

test('Refresh reloads the document and returns to the chore view', async ({
  page,
}) => {
  await page.goto('/chores')
  const views = page.getByRole('navigation', { name: 'Board views' })
  await views.getByRole('button', { name: 'Rewards', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toHaveCount(3)
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByRole('button', { name: 'Refresh the board' }).click(),
  ])
  expect(
    await page.evaluate(
      () =>
        (
          performance.getEntriesByType(
            'navigation',
          )[0] as PerformanceNavigationTiming
        ).type,
    ),
  ).toBe('reload')
  await expect(
    views.getByRole('button', { name: 'Chores', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.c2-child')).toHaveCount(3)
  await expect(
    page.getByRole('heading', { name: 'Rewards', exact: true }),
  ).toHaveCount(0)
})
