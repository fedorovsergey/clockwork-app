import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

import RequestDetails from '../../src/components/RequestDetails.vue'
import createRequest from '../../src/features/request.js'
import { createMockGlobal } from '../helpers/createMockGlobal.js'
import { mountWithGlobal } from '../helpers/mountWithGlobal.js'
import { httpRequest, richRequest, cloneMetadata } from '../fixtures/metadata.js'

const detailStubs = {
	TabBar: {
		template: '<div class="tab-bar-stub"><slot /></div>',
		props: [ 'tabs', 'activeTab' ],
		emits: [ 'tab-selected' ]
	},
	SettingsModal: true,
	CreditsModal: true,
	SharingModal: true,
	SharingDeleteModal: true,
	MessagesOverlay: true,
	DetailsRequest: true,
	PerformanceTab: { template: '<div class="performance-tab-stub" />', props: [ 'active' ] },
	LogTab: { template: '<div class="log-tab-stub" />', props: [ 'active' ] },
	DatabaseTab: { template: '<div class="database-tab-stub" />', props: [ 'active' ] },
	OutputTab: { template: '<div class="output-tab-stub" />', props: [ 'active' ] }
}

describe('RequestDetails', () => {
	it('shows only tabs backed by request data', () => {
		const global = createMockGlobal({ $request: createRequest(cloneMetadata(richRequest)) })
		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		expect(wrapper.vm.shownTabs.database).toBe(true)
		expect(wrapper.vm.shownTabs.log).toBe(true)
		expect(wrapper.vm.shownTabs.output).toBe(true)
		expect(wrapper.find('.performance-tab-stub').exists()).toBe(true)
	})

	it('falls back to performance when saved tab is hidden', async () => {
		const global = createMockGlobal({ $request: createRequest(httpRequest) })
		global.activeDetailsTab = 'database'

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		expect(wrapper.vm.activeTab).toBe('performance')
	})

	it('switches active tab and disables incoming request mode', async () => {
		const global = createMockGlobal({ $request: createRequest(cloneMetadata(richRequest)) })
		global.showIncomingRequests = true

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		wrapper.vm.showTab('log')
		await nextTick()

		expect(global.activeDetailsTab).toBe('log')
		expect(global.showIncomingRequests).toBe(false)
	})

	it('shows loading overlay while request metadata is loading', () => {
		const global = createMockGlobal({
			$request: createRequest({ ...httpRequest, loading: true })
		})

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		expect(wrapper.find('.details-loading-overlay').exists()).toBe(true)
	})

	it('shows error overlay for non-authentication failures', () => {
		const global = createMockGlobal({
			$request: createRequest({
				...httpRequest,
				error: { error: 'network-error', message: 'Network failed' }
			})
		})

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		expect(wrapper.find('.details-error-overlay').exists()).toBe(true)
		expect(wrapper.text()).toContain('Network failed')
	})

	it('shows authentication overlay when authentication service is active', () => {
		const global = createMockGlobal({ $request: createRequest(httpRequest) })
		global.$authentication.shown = true
		global.$authentication.requires = [ 'username', 'password' ]

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		expect(wrapper.find('.details-authentication-overlay').exists()).toBe(true)
		expect(wrapper.find('input[type="password"]').exists()).toBe(true)
	})

	it('toggles layout panels and settings modal', async () => {
		const global = createMockGlobal({ $request: createRequest(httpRequest) })
		const save = vi.spyOn(global.$settings, 'save')
		const toggleSettings = vi.spyOn(global.$settings, 'toggle')

		const { wrapper } = mountWithGlobal(RequestDetails, {
			global,
			stubs: detailStubs
		})

		await wrapper.find('[title="Toggle requests"]').trigger('click')
		expect(global.$settings.global.requestsListCollapsed).toBe(true)
		expect(save).toHaveBeenCalled()

		await wrapper.find('[title="Toggle sidebar"]').trigger('click')
		expect(global.$settings.global.requestSidebarCollapsed).toBe(true)

		await wrapper.find('[title="Settings"]').trigger('click')
		expect(toggleSettings).toHaveBeenCalled()
	})
})
