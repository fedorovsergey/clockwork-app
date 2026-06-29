import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'

import DatabaseTab from '../../src/components/Tabs/DatabaseTab.vue'
import createRequest from '../../src/features/request.js'
import { createMockGlobal } from '../helpers/createMockGlobal.js'
import { mountWithGlobal } from '../helpers/mountWithGlobal.js'

function createRequestWithQueries(queries) {
	return createRequest({
		id: 'req-db-test-1',
		type: 'request',
		time: 1710000000,
		method: 'GET',
		uri: '/test',
		responseDuration: 10,
		databaseDuration: 0,
		log: [],
		modelsActions: [],
		cacheQueries: [],
		databaseQueries: queries
	})
}

const stubs = {
	DetailsTable: {
		template: '<div class="details-table-stub"><slot name="toolbar" :filter="{ input: \'\' }" /><slot name="body" :items="items" /></div>',
		props: [ 'items', 'filter', 'columns', 'title', 'icon', 'filterExample' ]
	},
	HighlightedCode: true,
	PrettyPrint: true,
	ShortenedText: true,
	StackTrace: true
}

describe('DatabaseTab', () => {
	it('shows all queries by default', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, model: 'App\\Models\\User', tags: [] },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1, model: 'App\\Models\\Log', tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		expect(wrapper.findAll('.counter')).toHaveLength(4) // queries, selects, inserts, time
	})

	it('filters to SELECT when selects counter is clicked', async () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, model: 'App\\Models\\User', tags: [] },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1, model: 'App\\Models\\Log', tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		await wrapper.findAll('.counter')[1].trigger('click')
		await nextTick()

		expect(wrapper.vm.queryTypeFilter).toBe('select')
	})

	it('filters to INSERT when inserts counter is clicked', async () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, model: 'App\\Models\\User', tags: [] },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1, model: 'App\\Models\\Log', tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		await wrapper.findAll('.counter')[2].trigger('click')
		await nextTick()

		expect(wrapper.vm.queryTypeFilter).toBe('insert')
	})

	it('resets filter when queries counter is clicked', async () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, model: 'App\\Models\\User', tags: [] },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1, model: 'App\\Models\\Log', tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		// set filter to select, then reset
		wrapper.vm.queryTypeFilter = 'select'
		await nextTick()

		await wrapper.findAll('.counter')[0].trigger('click')
		await nextTick()

		expect(wrapper.vm.queryTypeFilter).toBeNull()
	})

	it('highlights active counter with active class', async () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, model: 'App\\Models\\User', tags: [] },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1, model: 'App\\Models\\Log', tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		await wrapper.findAll('.counter')[1].trigger('click')
		await nextTick()

		expect(wrapper.findAll('.counter')[1].classes()).toContain('active')
		expect(wrapper.findAll('.counter')[0].classes()).not.toContain('active')
	})
})
