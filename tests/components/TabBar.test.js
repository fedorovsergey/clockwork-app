import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

import TabBar from '../../src/components/Details/TabBar.vue'
import { mount } from '@vue/test-utils'

describe('TabBar', () => {
	it('shortens overflowing tabs while keeping the active tab visible', async () => {
		const tabs = [
			{ text: 'Performance', name: 'performance', icon: 'activity', shown: true },
			{ text: 'Log', name: 'log', icon: 'edit-2', shown: true },
			{ text: 'Database', name: 'database', icon: 'database', shown: true },
			{ text: 'Output', name: 'output', icon: 'terminal', shown: true }
		]

		const wrapper = mount(TabBar, {
			props: {
				tabs,
				activeTab: 'performance'
			},
			global: {
				stubs: {
					TabHandle: {
						template: '<div class="tab-handle" />',
						props: [ 'text', 'name', 'icon', 'active', 'short', 'full' ]
					}
				}
			},
			attachTo: document.body
		})

		Object.defineProperty(wrapper.element, 'scrollWidth', { configurable: true, value: 500 })
		Object.defineProperty(wrapper.element, 'clientWidth', { configurable: true, value: 200 })

		wrapper.vm.hideOverflowingTabs()
		await nextTick()
		await nextTick()

		expect(wrapper.vm.shortTabs.length).toBeGreaterThan(0)
		expect(wrapper.vm.shortTabs.some(tab => tab.name === 'performance')).toBe(false)

		wrapper.unmount()
	})
})
