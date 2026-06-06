import { test, expect } from '@playwright/test'

import { mockClockworkApi, dismissWhatsNew } from './helpers/mockClockworkApi.js'

test.describe('Clockwork smoke flows', () => {
	test.beforeEach(async ({ page }) => {
		await mockClockworkApi(page)
	})

	async function openApp(page) {
		await page.goto('/')
		await dismissWhatsNew(page)
	}

	test('loads requests and shows request details', async ({ page }) => {
		await openApp(page)

		await expect(page.locator('#requests tr').first()).toBeVisible({ timeout: 15000 })
		await expect(page.locator('#requests tr.selected')).toBeVisible()
		await expect(page.locator('.split-view-details')).toBeVisible()
	})

	test('switches detail tabs from the tab bar', async ({ page }) => {
		await openApp(page)

		await expect(page.locator('.details-header-tabs')).toBeVisible({ timeout: 15000 })

		const logTab = page.locator('.details-header-tab', { hasText: 'Log' })

		if (await logTab.count()) {
			await logTab.first().click()
			await expect(logTab.first()).toHaveClass(/active/)
		} else {
			await expect(page.locator('.details-header-tab', { hasText: 'Performance' })).toHaveClass(/active/)
		}
	})

	test('opens and closes settings modal', async ({ page }) => {
		await openApp(page)

		await page.locator('[title="Settings"]').click({ timeout: 15000 })
		await expect(page.locator('.modal-header', { hasText: 'Settings' })).toBeVisible()

		await page.locator('.appearance-controls .option', { hasText: 'Dark' }).click()
		await expect(page.locator('.application.dark')).toBeVisible()

		await page.locator('.header-close').click()
		await expect(page.locator('.modal-header', { hasText: 'Settings' })).toHaveCount(0)
	})

	test('collapses requests list and sidebar panels', async ({ page }) => {
		await openApp(page)

		await expect(page.locator('.split-view-requests')).toBeVisible({ timeout: 15000 })

		await page.locator('[title="Toggle requests"]').click()
		await expect(page.locator('.split-view-requests')).toHaveCount(0)

		await page.locator('[title="Toggle sidebar"]').click()
		await expect(page.locator('.request-sidebar')).toHaveCount(0)
	})

	test('shows authentication overlay for protected metadata', async ({ page }) => {
		await mockClockworkApi(page, { requireAuth: true })
		await page.goto('/')

		await expect(page.locator('.details-authentication-overlay')).toBeVisible({ timeout: 15000 })
		await expect(page.locator('input[placeholder="Username"]')).toBeVisible()
		await expect(page.locator('input[placeholder="Password"]')).toBeVisible()
	})
})
