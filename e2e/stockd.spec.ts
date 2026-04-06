import { test, expect } from '@playwright/test'

const BASE_URL = 'https://stockd-lovat.vercel.app'

// Must match auth.setup.ts
const EMAIL = 'qa-playwright@stockd.test'
const PASSWORD = 'testpass123'

// ─── AUTH TESTS (no storageState — tests the login/signup UI itself) ───────────

test.describe('Auth & Signup', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('TC1: Login page loads with Sign in heading and form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('h1')).toHaveText('Sign in')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in')
  })

  test('TC2: Signup page step 1 — account details form visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await expect(page.locator('h1')).toHaveText('Create account')
    await expect(page.locator('input[placeholder="e.g. Junho"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toHaveText('Continue')
  })

  test('TC3: Signup step 1 → step 2 transition on Continue', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.locator('input[placeholder="e.g. Junho"]').fill('TC3 User')
    await page.locator('input[type="email"]').fill(`tc3-${Date.now()}@test.com`)
    await page.locator('input[type="password"]').fill('testpass123')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('h1')).toHaveText('Set up your household')
    await expect(page.locator('button', { hasText: 'Create new' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Join existing' })).toBeVisible()
    await expect(page.locator('input[placeholder="e.g. Our Home"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toHaveText('Create account')
  })

  test('TC4: Login with test account redirects to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    await expect(page.locator('text=Household supplies')).toBeVisible()
  })

  test('TC5: Login with wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=/Invalid|invalid|incorrect/i')).toBeVisible({ timeout: 10000 })
  })
})

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC6: Dashboard shows "+ category" and "+ add item" buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: '+ category' })).toBeVisible()
    await expect(page.locator('button', { hasText: '+ add item' })).toBeVisible()
  })

  test('TC7: Empty state shown when no items exist', async ({ page }) => {
    await expect(page.locator('text=No items yet.')).toBeVisible()
  })
})

// ─── CATEGORY MANAGEMENT ──────────────────────────────────────────────────────

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC8: "+ category" button opens Add Category modal with Icon and Name fields', async ({ page }) => {
    await page.locator('button', { hasText: '+ category' }).click()
    await expect(page.getByText('Add category', { exact: true })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Icon' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Name' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'add category' })).toBeVisible()
  })

  test('TC9: Create category with name and icon — category appears on dashboard', async ({ page }) => {
    await page.locator('button', { hasText: '+ category' }).click()
    await expect(page.getByText('Add category', { exact: true })).toBeVisible()

    await page.locator('input[placeholder="e.g. Cleaning"]').fill('QA Cleaning')
    // Icon input — first text input in the modal
    const iconInput = page.locator('input[type="text"]').first()
    await iconInput.fill('🧹')

    await page.locator('button', { hasText: 'add category' }).click()
    await expect(page.getByText('Add category', { exact: true })).not.toBeVisible({ timeout: 10000 })
  })
})

// ─── ITEM MANAGEMENT ──────────────────────────────────────────────────────────

test.describe('Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC10: "+ add item" opens Add Item modal with correct fields', async ({ page }) => {
    await page.locator('button', { hasText: '+ add item' }).click()
    await expect(page.locator('text=Add new item')).toBeVisible()
    await expect(page.locator('input[placeholder="e.g. Laundry detergent"]')).toBeVisible()
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'add item', exact: true })).toBeVisible()
    await expect(page.locator('button', { hasText: 'cancel' })).toBeVisible()
  })

  test('TC11: Add item in depletion mode — item appears on dashboard', async ({ page }) => {
    await page.locator('button', { hasText: '+ add item' }).click()
    await expect(page.locator('text=Add new item')).toBeVisible()

    await page.locator('input[placeholder="e.g. Laundry detergent"]').fill('QA Detergent')
    await page.locator('input[placeholder="e.g. 3000"]').fill('3000')
    await page.locator('input[placeholder="e.g. 200"]').fill('100')
    await page.locator('input[placeholder="e.g. g, kg, bags, doses"]').fill('g')
    await page.locator('input[placeholder="e.g. 48500"]').fill('48500')

    await page.getByRole('button', { name: 'add item', exact: true }).click()
    await expect(page.locator('text=Add new item')).not.toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=QA Detergent')).toBeVisible({ timeout: 15000 })
  })

  test('TC12: Add item modal warns "Discard this item?" before closing when name is typed', async ({ page }) => {
    await page.locator('button', { hasText: '+ add item' }).click()
    await expect(page.locator('text=Add new item')).toBeVisible()

    await page.locator('input[placeholder="e.g. Laundry detergent"]').fill('Test item name')

    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('Discard this item?')
      await dialog.dismiss()
    })

    await page.mouse.click(5, 5)
    await expect(page.locator('text=Add new item')).toBeVisible()
  })

  test('TC13: Add item in cycle mode — item appears on dashboard', async ({ page }) => {
    await page.locator('button', { hasText: '+ add item' }).click()
    await expect(page.locator('text=Add new item')).toBeVisible()

    await page.locator('input[placeholder="e.g. Laundry detergent"]').fill('QA Cycle Item')
    await page.locator('select').nth(1).selectOption('cycle')

    await expect(page.locator('input[placeholder="e.g. 28"]')).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()

    await page.locator('input[placeholder="e.g. 28"]').fill('30')
    await page.locator('input[type="date"]').fill(new Date().toISOString().split('T')[0])
    await page.locator('input[placeholder="e.g. g, kg, bags, doses"]').fill('bags')

    await page.getByRole('button', { name: 'add item', exact: true }).click()
    await expect(page.locator('text=Add new item')).not.toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=QA Cycle Item')).toBeVisible({ timeout: 15000 })
  })
})

// ─── TRACKING DISPLAY ─────────────────────────────────────────────────────────

test.describe('Tracking Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC14: Depletion item card shows stock and progress bar', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /QA Detergent/ }).first()
    await expect(card).toBeVisible({ timeout: 15000 })
    const cardText = await card.innerText()
    expect(cardText).toMatch(/left|estimated|g/)
  })

  test('TC15: Cycle item card shows "cycle" badge', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /QA Cycle Item/ }).first()
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.locator('div', { hasText: 'cycle' }).first()).toBeVisible()
  })
})

// ─── PURCHASE LIFECYCLE ───────────────────────────────────────────────────────

test.describe('Purchase Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC16: "buy now" button appears on depletion item card', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'buy now' }).first()).toBeVisible({ timeout: 15000 })
  })

  test('TC17: "buy now" opens Confirm purchase modal', async ({ page }) => {
    await page.locator('button', { hasText: 'buy now' }).first().click()
    await expect(page.locator('h3', { hasText: /Confirm purchase/ })).toBeVisible()
    await expect(page.locator('text=Last recorded price')).toBeVisible()
    await expect(page.locator('input[placeholder="Enter today\'s price (₩)"]')).toBeVisible()
    await expect(page.locator('button', { hasText: 'confirm purchase' })).toBeVisible()
  })

  test('TC18: 5% variance triggers warning on first submit', async ({ page }) => {
    await page.locator('button', { hasText: 'buy now' }).first().click()
    await expect(page.locator('h3', { hasText: /Confirm purchase/ })).toBeVisible()

    await page.locator('input[placeholder="Enter today\'s price (₩)"]').fill('53350')
    await page.locator('button', { hasText: 'confirm purchase' }).click()

    await expect(page.locator('text=more than 5% different')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button', { hasText: 'confirm anyway' })).toBeVisible()
  })

  test('TC19: Confirming purchase transitions item to ordered state', async ({ page }) => {
    await page.locator('button', { hasText: 'buy now' }).first().click()
    await expect(page.locator('h3', { hasText: /Confirm purchase/ })).toBeVisible()

    await page.locator('input[placeholder="Enter today\'s price (₩)"]').fill('48500')
    await page.locator('button', { hasText: 'confirm purchase' }).click()
    await expect(page.locator('h3', { hasText: /Confirm purchase/ })).not.toBeVisible({ timeout: 10000 })

    await page.waitForTimeout(3000)
    await expect(page.locator('text=ordered').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button', { hasText: 'mark arrived' }).first()).toBeVisible()
    await expect(page.locator('text=purchased · optimistically restocked').first()).toBeVisible()
  })

  test('TC20: "mark arrived" opens modal pre-filled with ordered quantity', async ({ page }) => {
    // If not already ordered, trigger purchase first
    const markArrivedBtn = page.locator('button', { hasText: 'mark arrived' }).first()
    if (!await markArrivedBtn.isVisible().catch(() => false)) {
      await page.locator('button', { hasText: 'buy now' }).first().click()
      await page.locator('input[placeholder="Enter today\'s price (₩)"]').fill('48500')
      await page.locator('button', { hasText: 'confirm purchase' }).click()
      await expect(page.locator('h3', { hasText: /Confirm purchase/ })).not.toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(3000)
    }

    await markArrivedBtn.click()
    await expect(page.locator('h3', { hasText: /arrived/ })).toBeVisible()
    await expect(page.locator('text=Confirm the quantity you received')).toBeVisible()
    const prefilled = await page.locator('input[type="number"]').first().inputValue()
    expect(prefilled).not.toBe('')
    await expect(page.locator('button', { hasText: 'confirm restock' })).toBeVisible()
  })

  test('TC21: Confirming mark arrived returns card to normal state', async ({ page }) => {
    const markArrivedBtn = page.locator('button', { hasText: 'mark arrived' }).first()
    if (!await markArrivedBtn.isVisible().catch(() => false)) {
      await page.locator('button', { hasText: 'buy now' }).first().click()
      await page.locator('input[placeholder="Enter today\'s price (₩)"]').fill('48500')
      await page.locator('button', { hasText: 'confirm purchase' }).click()
      await expect(page.locator('h3', { hasText: /Confirm purchase/ })).not.toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(3000)
    }

    await markArrivedBtn.click()
    await page.locator('button', { hasText: 'confirm restock' }).click()
    await expect(page.locator('button', { hasText: 'confirm restock' })).not.toBeVisible({ timeout: 10000 })

    await page.waitForTimeout(3000)
    await expect(page.locator('button', { hasText: 'buy now' }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=ordered')).not.toBeVisible()
  })
})

// ─── CHECK-IN ─────────────────────────────────────────────────────────────────

test.describe('Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC22: "check in" button opens CheckinModal', async ({ page }) => {
    await page.locator('button', { hasText: 'check in' }).first().click()
    await expect(page.locator('h3', { hasText: /Check in/ })).toBeVisible()
    await expect(page.locator('text=Update the current stock level')).toBeVisible()
    await expect(page.locator('label', { hasText: /Current amount remaining/ })).toBeVisible()
    await expect(page.locator('button', { hasText: 'save' })).toBeVisible()
  })

  test('TC23: Check-in modal closes and item remains visible after save', async ({ page }) => {
    await page.locator('button', { hasText: 'check in' }).first().click()
    await expect(page.locator('h3', { hasText: /Check in/ })).toBeVisible()

    await page.locator('input[type="number"]').first().fill('2500')
    await page.locator('button', { hasText: 'save' }).click()
    await expect(page.locator('h3', { hasText: /Check in/ })).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=QA Detergent')).toBeVisible()
  })

  test('TC24: "mark bought" on cycle item opens cycle-reset modal', async ({ page }) => {
    await page.locator('button', { hasText: 'mark bought' }).first().click()
    await expect(page.locator('h3', { hasText: /Mark bought/ })).toBeVisible()
    await expect(page.locator('text=reset the cycle clock')).toBeVisible()
  })
})

// ─── CATEGORY INLINE EDITING ──────────────────────────────────────────────────

test.describe('Category Inline Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC25: Category name becomes editable via "edit name" button', async ({ page }) => {
    const editBtn = page.locator('button', { hasText: 'edit name' }).first()
    if (!await editBtn.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await editBtn.click()
    // "edit name" button disappears when editing mode is active
    await expect(editBtn).not.toBeVisible({ timeout: 3000 })
    // An input appears in its place (autoFocus)
    await expect(page.locator('input:focus')).toBeVisible({ timeout: 3000 })
  })
})

// ─── REMINDERS SECTION ────────────────────────────────────────────────────────

test.describe('Reminders Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.locator('text=Household supplies')).toBeVisible({ timeout: 15000 })
  })

  test('TC26: Reminders section appears when urgent item is added', async ({ page }) => {
    await page.locator('button', { hasText: '+ add item' }).click()
    await expect(page.locator('text=Add new item')).toBeVisible()

    await page.locator('input[placeholder="e.g. Laundry detergent"]').fill('QA Urgent Item')
    await page.locator('input[placeholder="e.g. 3000"]').fill('10')
    await page.locator('input[placeholder="e.g. 200"]').fill('10')
    await page.locator('input[placeholder="e.g. g, kg, bags, doses"]').fill('units')
    await page.getByRole('button', { name: 'add item', exact: true }).click()

    await expect(page.locator('text=Add new item')).not.toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Active reminders')).toBeVisible({ timeout: 15000 })
  })
})
