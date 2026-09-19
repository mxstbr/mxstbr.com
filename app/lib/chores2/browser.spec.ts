import { test, expect } from '@playwright/test'

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
  await page.clock.fastForward(301000)
  await page.getByRole('button', { name: 'Tap to wake up' }).click()
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
  await devina.getByRole('button', { name: /I did it!/ }).click()
  await expect(devina.locator('.c2-wallet')).toHaveText(`${balance + 4} ★`)

  await devina.locator('.c2-wallet').click()
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
