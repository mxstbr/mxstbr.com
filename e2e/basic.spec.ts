import { test, expect } from '@playwright/test'

test('home page renders key sections', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'TL;DR' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Essays' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Shopify' }).first(),
  ).toBeVisible()
})

test('navigate to an essay from the homepage', async ({ page }) => {
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
