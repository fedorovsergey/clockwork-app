import { reactive, shallowReactive } from 'vue'
import { vi } from 'vitest'

import createRequest from '../../src/features/request.js'
import { Requests } from '../../src/features/requests.js'
import { RequestsSearch } from '../../src/features/requests-search.js'
import { Authentication } from '../../src/features/authentication.js'

import { httpRequest, allRequests } from '../fixtures/metadata.js'

export function createMockSettings(overrides = {}) {
	const settings = reactive({
		global: {
			appearance: 'light',
			databasePrettified: false,
			dnsId: null,
			editor: null,
			showIncomingRequests: true,
			preserveLog: false,
			requestsListCollapsed: false,
			requestSidebarCollapsed: false,
			hideCommandTypeRequests: false,
			hideQueueJobTypeRequests: false,
			hideTestTypeRequests: false,
			...(overrides.global || {})
		},
		site: {
			authToken: ''
		}
	})

	return shallowReactive({
		shown: false,
		get appearance() {
			return settings.global.appearance != 'auto' ? settings.global.appearance : 'light'
		},
		global: settings.global,
		site: settings.site,
		save: vi.fn(),
		toggle: vi.fn(function () { this.shown = ! this.shown })
	})
}

export function createMockPlatform(overrides = {}) {
	return {
		hasFeature: vi.fn(feature => ! [ 'delete-shared', 'details-request' ].includes(feature)),
		...overrides
	}
}

export function createMockRequests(options = {}) {
	const requests = new Requests()
	const settings = createMockSettings(options.settings)

	requests.settings = settings
	requests.setRemote('http://localhost', { path: '/__clockwork/' })

	if (options.items) {
		requests.setItems(options.items.map(item => createRequest(item)))
	}

	requests.setClient(options.client || vi.fn(() => Promise.resolve([])))

	return shallowReactive(requests)
}

export function createMockRequestsSearch(requests) {
	return shallowReactive(new RequestsSearch(requests))
}

export function createMockAuthentication(requests) {
	return shallowReactive(new Authentication(requests))
}

export function createMockGlobal(overrides = {}) {
	const $requests = overrides.$requests || createMockRequests({
		items: overrides.requestsItems || allRequests,
		...overrides.requestsOptions
	})
	const $settings = overrides.$settings || createMockSettings(overrides.settings)
	const $authentication = overrides.$authentication || createMockAuthentication($requests)
	const $requestsSearch = overrides.$requestsSearch || createMockRequestsSearch($requests)

	const global = {
		$requests,
		$settings,
		$platform: overrides.$platform || createMockPlatform(overrides.platform),
		$authentication,
		$requestsSearch,
		$sharing: overrides.$sharing || { toggle: vi.fn(), toggleDelete: vi.fn() },
		$request: overrides.$request !== undefined
			? overrides.$request
			: createRequest(httpRequest),
		$round: (value, precision = 0) => parseFloat(parseFloat(value).toFixed(precision)),
		activeDetailsTab: overrides.activeDetailsTab || 'performance',
		showIncomingRequests: overrides.showIncomingRequests !== undefined
			? overrides.showIncomingRequests
			: true
	}

	return global
}
