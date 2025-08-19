import { test, expect } from '@playwright/test'

// Test all static pages
const staticPages = [
  '/',
  '/os',
  '/oss', 
  '/stats',
  '/todos',
  '/reminder',
  '/finance',
  '/readme',
  '/investing',
  '/notes'
]

// Test blog posts
const blogPosts = [
  '/thoughts/css-in-js',
  '/thoughts/gatsby',
  '/thoughts/graphql',
  '/thoughts/margin',
  '/thoughts/streaming-ssr',
  '/thoughts/tailwind',
  '/thoughts/tech-choice-regrets-at-spectrum'
]

test.describe('Smoke Tests', () => {
  // Test all static pages
  for (const path of staticPages) {
    test(`${path} loads without errors`, async ({ page }) => {
      // Check for no console errors during page load
      page.on('pageerror', (error) => {
        throw new Error(`Page error on ${path}: ${error.message}`)
      })
      
      await page.goto(path)
      
      // Check that page loads without error status
      await page.waitForLoadState('networkidle')
      
      // Verify page has loaded by checking for body element (always present)
      await expect(page.locator('body')).toBeVisible()
      
      // Check that the page title is present (indicates successful render)
      await expect(page).toHaveTitle(/.+/)
    })
  }
  
  // Test blog posts
  for (const path of blogPosts) {
    test(`Blog post ${path} loads`, async ({ page }) => {
      // Check for no console errors
      page.on('pageerror', (error) => {
        throw new Error(`Page error on ${path}: ${error.message}`)
      })
      
      await page.goto(path)
      
      // Verify h1 is visible (all blog posts should have titles) - use first() to avoid strict mode
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }
  
  // Test that notes page has note links
  test('Notes page has note links', async ({ page }) => {
    // Check for no console errors
    page.on('pageerror', (error) => {
      throw new Error(`Page error on /notes: ${error.message}`)
    })
    
    await page.goto('/notes')
    
    // Look for links to individual notes
    const noteLinks = page.locator('a[href^="/notes/"]')
    await expect(noteLinks.first()).toBeVisible()
  })
  
  // Test a few note topic pages if they exist
  test('Notes topic pages work', async ({ page }) => {
    await page.goto('/notes')
    
    // Try to find topic links
    const topicLinks = page.locator('a[href^="/notes/topics/"]')
    const topicCount = await topicLinks.count()
    
    if (topicCount > 0) {
      // Test the first topic page
      const firstTopicHref = await topicLinks.first().getAttribute('href')
      if (firstTopicHref) {
        await page.goto(firstTopicHref)
        await expect(page.locator('h1, main')).toBeVisible()
      }
    }
  })
})
