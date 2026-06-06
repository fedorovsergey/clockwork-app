import { describe, it, expect } from 'vitest'

import createRequest from '../../src/features/request.js'
import {
	httpRequest,
	commandRequest,
	queueJobRequest,
	testRequest,
	richRequest
} from '../fixtures/metadata.js'

describe('Request', () => {
	it('normalizes a basic HTTP request', () => {
		const request = createRequest(httpRequest)

		expect(request.isRequest()).toBe(true)
		expect(request.isAjax()).toBeTruthy()
		expect(request.responseDurationRounded).toBe(126)
		expect(request.databaseDurationRounded).toBe(12)
		expect(request.memoryUsageFormatted).toMatch(/kB|MB/)
		expect(request.tooltip).toContain('GET /users')
	})

	it('normalizes command requests', () => {
		const request = createRequest(commandRequest)

		expect(request.isCommand()).toBe(true)
		expect(request.commandLine).toContain('--env=local')
		expect(request.tooltip).toContain('[CMD] migrate')
	})

	it('normalizes queue job requests', () => {
		const request = createRequest(queueJobRequest)

		expect(request.isQueueJob()).toBe(true)
		expect(request.isQueueJobError()).toBe(false)
		expect(request.tooltip).toContain('[QUEUE]')
	})

	it('normalizes test requests and splits group/name', () => {
		const request = createRequest(testRequest)

		expect(request.isTest()).toBe(true)
		expect(request.testGroup).toBe('Feature\\UserTest')
		expect(request.testName).toBe('test_index')
	})

	it('detects HTTP error classes', () => {
		const clientError = createRequest({ ...httpRequest, responseStatus: 404 })
		const serverError = createRequest({ ...httpRequest, responseStatus: 500 })

		expect(clientError.isClientError()).toBe(true)
		expect(clientError.isServerError()).toBe(false)
		expect(serverError.isServerError()).toBe(true)
	})

	it('creates sorted key-value pairs', () => {
		const request = createRequest({
			...httpRequest,
			getData: { b: '2', a: '1' }
		})

		expect(request.getData.map(pair => pair.name)).toEqual([ 'a', 'b' ])
	})

	it('processes rich metadata used by detail tabs', () => {
		const request = createRequest(richRequest)

		expect(request.log).toHaveLength(2)
		expect(request.databaseQueriesCount).toBe(1)
		expect(request.cacheQueries).toHaveLength(1)
		expect(request.redisCommands).toHaveLength(1)
		expect(request.queueJobs).toHaveLength(1)
		expect(request.events).toHaveLength(1)
		expect(request.viewsData.events).toHaveLength(1)
		expect(request.notifications).toHaveLength(1)
		expect(request.httpRequests).toHaveLength(1)
		expect(request.routes).toHaveLength(1)
		expect(request.userData).toHaveLength(1)
		expect(request.warningsCount).toBeGreaterThan(0)
	})

	it('resolves placeholders with partial fields', () => {
		const request = createRequest({ ...httpRequest, loading: true })

		request.resolve(createRequest({
			...httpRequest,
			log: [ { level: 'info', message: 'Loaded', time: 1710000001 } ]
		}), [ 'log' ])

		expect(request.loading).toBe(false)
		expect(request.log).toHaveLength(1)
		expect(request.databaseQueries).toHaveLength(0)
	})

	it('stores load errors on placeholders', () => {
		const request = createRequest({ ...httpRequest, loading: true })
		const error = { error: 'network-error', message: 'Network failed' }

		request.resolveWithError(error)

		expect(request.loading).toBe(false)
		expect(request.error).toEqual(error)
	})
})
