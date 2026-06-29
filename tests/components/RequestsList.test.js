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

	it('hides requests matching ignored paths', () => {
		const global = createMockGlobal()
		global.$settings.global.ignorePaths = [ '/users' ]

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.text()).not.toContain('/users')
		expect(wrapper.text()).toContain('CMD')
	})

	it('hides requests matching ignored path prefix', () => {
		const global = createMockGlobal()
		global.$settings.global.ignorePaths = [ '/or' ]

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.text()).not.toContain('/orders')
	})

	it('hides requests matching ignored regex pattern', () => {
		const global = createMockGlobal()
		global.$settings.global.ignorePaths = [ '/\\/users/' ]

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.text()).not.toContain('/users')
	})

	it('ignores a request when ignore button is clicked', async () => {
		const global = createMockGlobal()
		const save = vi.spyOn(global.$settings, 'save')

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		await wrapper.findAll('#requests tr')[0].find('.ignore-button').trigger('click')

		expect(global.$settings.global.ignorePaths).toContain('/users')
		expect(save).toHaveBeenCalled()
	})

	it('strips query string from .php URIs when ignoring', async () => {
		const global = createMockGlobal()
		const phpRequest = createRequest({
			...httpRequest,
			id: 'req-php-1',
			uri: '/file.php?foo=bar&baz=1'
		})
		global.$requests.items.push(phpRequest)

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		const rows = wrapper.findAll('#requests tr')
		const phpRow = rows.filter(r => r.text().includes('/file.php'))[0]
		await phpRow.find('.ignore-button').trigger('click')

		expect(global.$settings.global.ignorePaths).toContain('/file.php')
		expect(global.$settings.global.ignorePaths).not.toContain('/file.php?foo=bar&baz=1')
	})

	it('strips last path segment for non-php URIs without url=', async () => {
		const global = createMockGlobal()
		const detailRequest = createRequest({
			...httpRequest,
			id: 'req-detail-1',
			uri: '/users/42'
		})
		global.$requests.items.push(detailRequest)

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		const rows = wrapper.findAll('#requests tr')
		const detailRow = rows.filter(r => r.text().includes('/users/42'))[0]
		await detailRow.find('.ignore-button').trigger('click')

		expect(global.$settings.global.ignorePaths).toContain('/users/')
		expect(global.$settings.global.ignorePaths).not.toContain('/users/42')
	})

	it('extracts only url= parameter when ignoring url= requests', async () => {
		const global = createMockGlobal()
		const save = vi.spyOn(global.$settings, 'save')
		const urlRequest = createRequest({
			...httpRequest,
			id: 'req-url-1',
			uri: '/web/?url=admin/monitoring/page-generation&DNSID=abc&user_id=123'
		})
		global.$requests.items.push(urlRequest)

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		const rows = wrapper.findAll('#requests tr')
		const urlRow = rows.filter(r => r.text().includes('admin/monitoring'))[0]
		await urlRow.find('.ignore-button').trigger('click')

		expect(global.$settings.global.ignorePaths).toContain('url=admin/monitoring/page-generation')
		expect(global.$settings.global.ignorePaths).not.toContain('/web/')
		expect(global.$settings.global.ignorePaths).not.toContain('DNSID')
		expect(save).toHaveBeenCalled()
	})

	it('matches url= patterns by substring containment', () => {
		const global = createMockGlobal()
		global.$settings.global.ignorePaths = [ 'url=some-route' ]

		const urlRequest = createRequest({
			...httpRequest,
			id: 'req-url-1',
			uri: '/web/?url=some-route&foo=bar'
		})
		global.$requests.items.push(urlRequest)

		const { wrapper } = mountWithGlobal(RequestsList, { global })

		expect(wrapper.text()).not.toContain('some-route')
	})
})
