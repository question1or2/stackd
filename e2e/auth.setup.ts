import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

export const EMAIL = 'qa-playwright@stockd.test'
export const PASSWORD = 'testpass123'
export const DISPLAY_NAME = 'QA Tester'
export const HOUSEHOLD_NAME = 'QA Household'

setup('create test account and save auth state', async ({ page }) => {
  // First try login — account may already exist from a previous run
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  const loggedIn = await page.waitForURL('**/dashboard', { timeout: 10000 }).then(() => true).catch(() => false)

  if (!loggedIn) {
    // Account doesn't exist yet — sign up
    await page.goto('/signup')
    await page.locator('input[placeholder="e.g. Junho"]').fill(DISPLAY_NAME)
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('h1')).toHaveText('Set up your household')
    await page.locator('input[placeholder="e.g. Our Home"]').fill(HOUSEHOLD_NAME)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL('**/dashboard', { timeout: 30000 })
  }

  await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  await page.context().storageState({ path: authFile })
})
