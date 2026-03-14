import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('opens settings modal', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByText('Difficulty')).toBeVisible()
  })

  test('shows three difficulty options', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByRole('button', { name: 'Easy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Normal' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Strict' })).toBeVisible()
  })

  test('shows audio settings', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByText('Volume')).toBeVisible()
    await expect(page.getByText('Ping on combo steps')).toBeVisible()
    await expect(page.getByText('Grade sounds')).toBeVisible()
  })

  test('shows keybind editor', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByText('Q - Spell 1')).toBeVisible()
    await expect(page.getByText('R - Spell 4')).toBeVisible()
  })

  test('shows calibration section', async ({ page }) => {
    await page.getByLabel('Settings').click()
    await expect(page.getByText('Input Calibration')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Calibration' })).toBeVisible()
  })
})
