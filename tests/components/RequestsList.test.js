import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

import RequestsList from '../../src/components/RequestsList.vue'
import createRequest from '../../src/features/request.js'
import { createMockGlobal } from '../helpers/createMockGlobal.js'
import { mountWithGlobal } from '../helpers/mountWithGlobal.js'
import { allRequests, httpRequest, commandRequest } from '../fixtures/metadata.js'

describe('RequestsList', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	it('renders requests and marks the active row', () => {
		const global = createMockGlobal()
		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.findAll('#requests tr')).toHaveLength(allRequests.length)
		expect(wrapper.find('tr.selected').exists()).toBe(true)
	})

	it('selects a request when a row is clicked', async () => {
		const global = createMockGlobal({ $request: null })
		const { wrapper } = mountWithGlobal(RequestsList, { global })

		await wrapper.findAll('#requests tr')[1].trigger('click')

		expect(global.$request.id).toBe(commandRequest.id)
	})

	it('loads more previous requests', async () => {
		const global = createMockGlobal()
		const loadPrevious = vi.spyOn(global.$requests, 'loadPrevious').mockResolvedValue([])

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		await wrapper.find('.content-above .button').trigger('click')

		expect(loadPrevious).toHaveBeenCalledWith(10)
	})

	it('clears all requests', async () => {
		const global = createMockGlobal()
		const clear = vi.spyOn(global.$requests, 'clear')

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		await wrapper.find('.requests-clear').trigger('click')

		expect(clear).toHaveBeenCalled()
	})

	it('hides filtered request types based on settings', () => {
		const global = createMockGlobal()
		global.$settings.global.hideCommandTypeRequests = true

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.text()).not.toContain('CMD')
		expect(wrapper.text()).toContain('GET')
	})

	it('auto-selects the first request when preserveLog is disabled', async () => {
		const global = createMockGlobal({ $request: null })
		global.$settings.global.preserveLog = false

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		global.$requests.push(createRequest({ ...httpRequest, id: 'req-new', time: 1710009999 }))
		await nextTick()

		expect(global.$request.id).toBe(global.$requests.first().id)
	})

	it('requests authentication when active request requires it', async () => {
		const request = createRequest({ ...httpRequest, loading: true })
		const global = createMockGlobal({ $request: request })
		const requestAuth = vi.spyOn(global.$authentication, 'request')

		mountWithGlobal(RequestsList, { global })

		Object.assign(request, {
			loading: false,
			error: {
				error: 'requires-authentication',
				message: 'Authentication required',
				requires: [ 'username', 'password' ]
			}
		})
		await nextTick()

		expect(requestAuth).toHaveBeenCalledWith(
			'Authentication required',
			[ 'username', 'password' ]
		)
	})
})
