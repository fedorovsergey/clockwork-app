import { describe, it, expect, beforeEach, vi } from 'vitest'

import createRequest from '../../src/features/request.js'
import { Requests } from '../../src/features/requests.js'
import { createMockSettings } from '../helpers/createMockGlobal.js'
import { httpRequest, commandRequest, richRequest } from '../fixtures/metadata.js'

describe('Requests', () => {
	let requests

	beforeEach(() => {
		requests = new Requests()
		requests.settings = createMockSettings()
		requests.setRemote('http://localhost:8000', { path: '/__clockwork/' })
	})

	it('builds remote url with path and query', () => {
		expect(requests.remoteUrl).toContain('/__clockwork/')
	})

	it('merges new requests and ignores duplicates', () => {
		const first = createRequest(httpRequest)

		requests.setItems([ first ])
		requests.merge([ createRequest(commandRequest), first ])

		expect(requests.items).toHaveLength(2)
		expect(requests.items[0].id).toBe(httpRequest.id)
		expect(requests.items[1].id).toBe(commandRequest.id)
	})

	it('sorts requests by time', () => {
		requests.setItems([
			createRequest({ ...commandRequest, time: 20 }),
			createRequest({ ...httpRequest, time: 10 })
		])

		requests.sort()

		expect(requests.items.map(request => request.time)).toEqual([ 10, 20 ])
	})

	it('loads request by id through client stub', async () => {
		const client = vi.fn(() => Promise.resolve([ richRequest ]))
		requests.setClient(client)

		const loaded = await requests.loadId('req-rich-1')

		expect(client).toHaveBeenCalled()
		expect(loaded.id).toBe('req-rich-1')
		expect(loaded.log).toHaveLength(2)
		expect(requests.findId('req-rich-1')).toBe(loaded)
	})

	it('applies temporary query parameters via withQuery', async () => {
		const client = vi.fn(() => Promise.resolve([ httpRequest ]))
		requests.setClient(client)

		await requests.withQuery({ only: 'log' }, () => {
			return requests.load({ request: httpRequest.id }, promise => promise)
		})

		expect(client.mock.calls[0][1]).toContain('only=log')
		expect(requests.query).toEqual({})
	})

	it('deduplicates exclusive loads', async () => {
		let resolve
		const client = vi.fn(() => new Promise(accept => { resolve = accept }))
		requests.setClient(client)

		const first = requests.load({ request: 'latest' }, promise => promise, true)
		const second = requests.load({ request: 'latest' }, promise => promise, true)

		expect(first).toBe(second)
		expect(client).toHaveBeenCalledTimes(1)

		resolve([ httpRequest ])
		await first
	})

	it('loads previous requests before the first item', async () => {
		requests.setItems([ createRequest(httpRequest) ])
		requests.setClient(() => Promise.resolve([ commandRequest ]))

		const loaded = await requests.loadPrevious(10)

		expect(loaded).toHaveLength(1)
		expect(requests.items).toHaveLength(2)
	})

	it('clears all loaded requests', () => {
		requests.setItems([ createRequest(httpRequest) ])
		requests.clear()

		expect(requests.items).toHaveLength(0)
	})

	it('resolves placeholders with errors from failed loads', async () => {
		const error = { error: 'network-error', message: 'Network failed' }
		requests.setClient(() => Promise.reject(error))

		await requests.loadId('missing-id')

		const placeholder = requests.findId('missing-id')

		expect(placeholder.loading).toBe(false)
		expect(placeholder.error).toEqual(error)
	})
})
