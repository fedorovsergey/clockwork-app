import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'

import LogTab from '../../src/components/Tabs/LogTab.vue'
import createRequest from '../../src/features/request.js'
import { createMockGlobal } from '../helpers/createMockGlobal.js'
import { mountWithGlobal } from '../helpers/mountWithGlobal.js'

function createRequestWithLogs(logs) {
	return createRequest({
		id: 'req-log-test-1',
		type: 'request',
		time: 1710000000,
		method: 'GET',
		uri: '/test',
		responseDuration: 10,
		databaseDuration: 0,
		log: logs,
		modelsActions: [],
		cacheQueries: [],
		databaseQueries: []
	})
}

const stubs = {
	DetailsTable: {
		template: '<div class="details-table-stub"><slot name="toolbar" :filter="{ input: \'\' }" /><slot name="after-header" /><slot name="body" :items="items" /></div>',
		props: [ 'items', 'filter', 'columns', 'title', 'icon', 'filterExample' ]
	},
	PrettyPrint: true,
	StackTrace: true
}

describe('LogTab', () => {
	it('shows Logger column when logs have logger_name in context', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001, context: { logger_name: 'test-logger' } }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.vm.columns).toContain('Logger')
	})

	it('hides Logger column when no logs have logger_name', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001 }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.vm.columns).not.toContain('Logger')
	})

	it('filters out logs with hidden logger_name', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Visible', time: 1710000001, context: { logger_name: 'visible' } },
			{ level: 'info', message: 'Hidden', time: 1710000002, context: { logger_name: 'hidden-logger' } }
		])

		const global = createMockGlobal({
			$request: request,
			settings: { global: { hiddenLoggers: [ 'hidden-logger' ] } }
		})
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.vm.log).toHaveLength(1)
		expect(wrapper.vm.log[0].message).toBe('Visible')
	})

	it('shows hidden loggers pills', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001, context: { logger_name: 'test-logger' } }
		])

		const global = createMockGlobal({
			$request: request,
			settings: { global: { hiddenLoggers: [ 'hidden-logger' ] } }
		})
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.vm.hiddenLoggers).toContain('hidden-logger')
	})

	it('hides logger when hideLogger is called', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001, context: { logger_name: 'test-logger' } }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		wrapper.vm.hideLogger('test-logger')

		expect(global.$settings.global.hiddenLoggers).toContain('test-logger')
		expect(global.$settings.save).toHaveBeenCalled()
	})

	it('unhides logger when unhideLogger is called', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001, context: { logger_name: 'test-logger' } }
		])

		const global = createMockGlobal({
			$request: request,
			settings: { global: { hiddenLoggers: [ 'test-logger' ] } }
		})
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		wrapper.vm.unhideLogger('test-logger')

		expect(global.$settings.global.hiddenLoggers).not.toContain('test-logger')
		expect(global.$settings.save).toHaveBeenCalled()
	})

	it('does not duplicate logger in hiddenLoggers', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Test', time: 1710000001, context: { logger_name: 'test-logger' } }
		])

		const global = createMockGlobal({
			$request: request,
			settings: { global: { hiddenLoggers: [ 'test-logger' ] } }
		})
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		wrapper.vm.hideLogger('test-logger')

		expect(global.$settings.global.hiddenLoggers).toEqual([ 'test-logger' ])
	})

	it('filters out performance logs', () => {
		const request = createRequestWithLogs([
			{ level: 'info', message: 'Normal', time: 1710000001 },
			{ level: 'info', message: 'Performance', time: 1710000002, context: { performance: true } }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(LogTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.vm.log).toHaveLength(1)
		expect(wrapper.vm.log[0].message).toBe('Normal')
	})
})
