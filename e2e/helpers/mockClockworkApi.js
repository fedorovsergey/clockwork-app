import { allRequests, httpRequest, richRequest, authError } from '../../tests/fixtures/metadata.js'

export function fulfillClockworkRoute(route, options = {}) {
	const url = new URL(route.request().url())
	const requestParam = url.searchParams.get('request')
	const only = url.searchParams.get('only')

	if (options.requireAuth && route.request().method() === 'GET') {
		return route.fulfill({
			status: 403,
			contentType: 'application/json',
			body: JSON.stringify(authError)
		})
	}

	if (route.request().method() === 'POST' && url.pathname.includes('auth')) {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ token: 'test-token' })
		})
	}

	if (requestParam === 'latest') {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([ httpRequest ])
		})
	}

	if (requestParam?.includes('/previous')) {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([])
		})
	}

	if (requestParam?.includes('/next')) {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([])
		})
	}

	if (requestParam && requestParam !== 'latest') {
		const id = requestParam.replace('/extended', '')
		const fixture = allRequests.find(item => item.id === id)
			|| (id === richRequest.id ? richRequest : httpRequest)

		if (only) {
			const partial = {}
			only.split(',').forEach(field => { partial[field] = fixture[field] })
			partial.id = fixture.id
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([ partial ])
			})
		}

		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([ fixture ])
		})
	}

	return route.continue()
}

export async function mockClockworkApi(page, options = {}) {
	await page.addInitScript(() => {
		localStorage.setItem('clockwork', JSON.stringify({
			settings: {
				global: {
					seenReleaseNotesVersion: '5.3',
					appearance: 'light',
					requestsListCollapsed: false,
					requestSidebarCollapsed: false
				},
				site: {}
			}
		}))
	})

	await page.route('**/__clockwork-remote/**', route => fulfillClockworkRoute(route, options))
}

export async function dismissWhatsNew(page) {
	const whatsNew = page.locator('.modal-header', { hasText: "What's new" })

	if (await whatsNew.isVisible().catch(() => false)) {
		await page.locator('.actions-close').click()
		await whatsNew.waitFor({ state: 'hidden' })
	}
}
