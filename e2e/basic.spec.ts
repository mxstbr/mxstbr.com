import { test, expect } from '@playwright/test'

test('home page renders its profile, sections and navigation', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Max Stoiber', level: 1, exact: true }),
  ).toBeVisible()

  for (const name of [
    'Some things about me:',
    'Some things I believe:',
    'Elsewhere:',
  ]) {
    await expect(page.getByRole('region', { name, exact: true })).toBeVisible()
  }

  const shopify = page.getByRole('link', { name: 'Shopify', exact: true })
  await expect(shopify).toBeVisible()
  await expect(shopify).toHaveAttribute('href', 'https://shopify.com')

  for (const [name, href] of [
    ['open source projects', '/oss'],
    ['Invest in early-stage startups', '/investing'],
    ['Essays', '/thoughts'],
    ['Notes', '/notes'],
  ]) {
    const link = page.getByRole('link', { name, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', href)
  }
})

test.skip('navigate to an essay from the homepage', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Margin considered harmful' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Margin considered harmful' }).click()
  await expect(page).toHaveURL(/\/thoughts\/margin/)
  await expect(
    page.getByRole('heading', { name: 'Margin considered harmful' }),
  ).toBeVisible()
})

test('readme page is accessible', async ({ page }) => {
  await page.goto('/readme')

  await expect(page.getByRole('heading', { name: 'My README' })).toBeVisible()
  await expect(page.getByText('user guide', { exact: false })).toBeVisible()
})
