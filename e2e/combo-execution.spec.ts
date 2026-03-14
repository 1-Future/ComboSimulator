import { test, expect } from '@playwright/test'

test.describe('Combo Execution', () => {
  test('shows placeholder when no combo selected', async ({ page }) => {
    await page.goto('/play/yasuo/keyblade')
    await expect(page.getByText('Select a champion and combo')).toBeVisible()
  })
})
