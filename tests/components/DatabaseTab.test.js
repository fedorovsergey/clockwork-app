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

describe('DatabaseTab — copySqlWithBindings', () => {
	it('replaces positional placeholders (?) with quoted values', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users WHERE id = ? AND status = ?', duration: 1, bindings: { '1': 42, '2': 'active' }, tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		let clipboardText = ''
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: (text) => { clipboardText = text } },
			writable: true
		})

		wrapper.vm.copySqlWithBindings(request.databaseQueries[0])

		expect(clipboardText).toBe("SELECT * FROM users WHERE id = 42 AND status = 'active'")
	})

	it('replaces named placeholders (:user_id)', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users WHERE id = :user_id AND status = :status', duration: 1, bindings: { ':user_id': 7, ':status': 'inactive' }, tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		let clipboardText = ''
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: (text) => { clipboardText = text } },
			writable: true
		})

		wrapper.vm.copySqlWithBindings(request.databaseQueries[0])

		expect(clipboardText).toBe("SELECT * FROM users WHERE id = 7 AND status = 'inactive'")
	})

	it('handles ANY(?) with array values', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM files WHERE name = ANY(?) AND deleted = 0', duration: 1, bindings: { '1': 'doc1.pdf', '2': 'doc2.pdf' }, tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		let clipboardText = ''
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: (text) => { clipboardText = text } },
			writable: true
		})

		wrapper.vm.copySqlWithBindings(request.databaseQueries[0])

		expect(clipboardText).toBe("SELECT * FROM files WHERE name = ANY({doc1.pdf,doc2.pdf}) AND deleted = 0")
	})

	it('handles null and boolean bindings', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users WHERE deleted = ? AND active = ?', duration: 1, bindings: { '1': false, '2': null }, tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		let clipboardText = ''
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: (text) => { clipboardText = text } },
			writable: true
		})

		wrapper.vm.copySqlWithBindings(request.databaseQueries[0])

		expect(clipboardText).toBe('SELECT * FROM users WHERE deleted = 0 AND active = NULL')
	})

	it('handles query without bindings', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1, tags: [] }
		])

		const global = createMockGlobal({ $request: request })
		const { wrapper } = mountWithGlobal(DatabaseTab, {
			global,
			props: { active: true },
			stubs
		})

		let clipboardText = ''
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: (text) => { clipboardText = text } },
			writable: true
		})

		wrapper.vm.copySqlWithBindings(request.databaseQueries[0])

		expect(clipboardText).toBe('SELECT * FROM users')
	})
})
