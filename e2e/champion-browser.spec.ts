import { test, expect } from '@playwright/test'

test.describe('Champion Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ComboSimulator/)
  })

  test('shows the header with logo', async ({ page }) => {
    await expect(page.getByText('ComboSimulator')).toBeVisible()
  })

  test('shows Champions heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Champions/i })).toBeVisible()
  })

  test('has a search input', async ({ page }) => {
    await expect(page.getByPlaceholder('Search champions...')).toBeVisible()
  })

  test('has role filter dropdown', async ({ page }) => {
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })

  test('navigates to editor page', async ({ page }) => {
    await page.getByRole('link', { name: 'Editor' }).click()
    await expect(page.getByText('Coming in Phase 3')).toBeVisible()
  })

  test('settings modal opens and closes', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByText('Difficulty')).toBeVisible()
    await expect(page.getByText('Keybinds')).toBeVisible()
    // Close modal
    await page.keyboard.press('Escape')
  })
})
