import { describe, it, expect } from 'vitest'

import App from '../../src/App.vue'
import { createMockGlobal } from '../helpers/createMockGlobal.js'
import { mountWithGlobal } from '../helpers/mountWithGlobal.js'

describe('App', () => {
	it('applies appearance class on the root element', () => {
		const global = createMockGlobal()
		global.$settings.global.appearance = 'dark'

		const { wrapper } = mountWithGlobal(App, {
			global,
			shallow: true
		})

		expect(wrapper.find('.application.dark').exists()).toBe(true)
	})

	it('hides requests list when feature is disabled', () => {
		const global = createMockGlobal({
			platform: {
				hasFeature: feature => feature !== 'requests-list'
			}
		})

		const { wrapper } = mountWithGlobal(App, {
			global,
			shallow: true
		})

		expect(wrapper.find('requests-list-stub').exists()).toBe(false)
	})

	it('hides sidebar when collapsed in settings', () => {
		const global = createMockGlobal()
		global.$settings.global.requestSidebarCollapsed = true

		const { wrapper } = mountWithGlobal(App, {
			global,
			shallow: true
		})

		expect(wrapper.find('request-sidebar-stub').exists()).toBe(false)
	})
})
