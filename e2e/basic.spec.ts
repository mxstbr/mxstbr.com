import { test, expect } from '@playwright/test'

test('home page renders key sections', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Max Stoiber', level: 1, exact: true }),
  ).toBeVisible()
  const about = page.getByRole('region', { name: 'Some things about me:' })
  await expect(about).toBeVisible()
  const shopify = about.getByRole('link', { name: 'Shopify', exact: true })
  await expect(shopify).toBeVisible()
  await expect(shopify).toHaveAttribute('href', 'https://shopify.com')
  await expect(
    page.getByRole('region', { name: 'Some things I believe:' }),
  ).toBeVisible()
  const elsewhere = page.getByRole('region', { name: 'Elsewhere:' })
  await expect(elsewhere).toBeVisible()
  const essays = elsewhere.getByRole('link', { name: 'Essays', exact: true })
  await expect(essays).toBeVisible()
  await expect(essays).toHaveAttribute('href', '/thoughts')
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
