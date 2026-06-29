import { describe, it, expect } from 'vitest'

import createRequest from '../../src/features/request.js'

function createRequestWithQueries(queries) {
	return createRequest({
		id: 'req-db-1',
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

describe('processDatabaseQueries — type detection', () => {
	it('detects SELECT', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('select')
	})

	it('detects INSERT', () => {
		const request = createRequestWithQueries([
			{ query: 'INSERT INTO users (name) VALUES (?)', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('insert')
	})

	it('detects UPDATE', () => {
		const request = createRequestWithQueries([
			{ query: 'UPDATE users SET name = ? WHERE id = ?', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('update')
	})

	it('detects DELETE', () => {
		const request = createRequestWithQueries([
			{ query: 'DELETE FROM users WHERE id = ?', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('delete')
	})

	it('treats WITH ... SELECT as select', () => {
		const request = createRequestWithQueries([
			{ query: 'WITH cte AS (SELECT * FROM users) SELECT * FROM cte', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('select')
	})

	it('treats BEGIN / COMMIT as select', () => {
		const request = createRequestWithQueries([
			{ query: 'BEGIN', duration: 1 },
			{ query: 'COMMIT', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('select')
		expect(request.databaseQueries[1].type).toBe('select')
	})

	it('treats EXPLAIN as select', () => {
		const request = createRequestWithQueries([
			{ query: 'EXPLAIN SELECT * FROM users', duration: 1 }
		])

		expect(request.databaseQueries[0].type).toBe('select')
	})

	it('strips prefix before SQL keyword', () => {
		const request = createRequestWithQueries([
			{
				query: `DB\\Postgres\\QueryBuilder\\AtomicUpsert query: {\n          INSERT INTO document_status AS D (document_id, user_id, status)\n          VALUES ($1::int, $2::int, $3::int)\n            ON CONFLICT (document_id, user_id) DO\n              UPDATE SET status = EXCLUDED.status\nWHERE D.status != $3::int\n-- }`,
				duration: 1
			}
		])

		expect(request.databaseQueries[0].type).toBe('insert')
	})

	it('strips prefix before SELECT', () => {
		const request = createRequestWithQueries([
			{
				query: 'DB::select(\n          SELECT * FROM users WHERE id = ?\n        )',
				duration: 1
			}
		])

		expect(request.databaseQueries[0].type).toBe('select')
	})
})

describe('processDatabaseQueries — shortQuery', () => {
	it('builds shortQuery for SELECT', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1 }
		])

		expect(request.databaseQueries[0].shortQuery).toBe('SELECT FROM users')
	})

	it('builds shortQuery for INSERT', () => {
		const request = createRequestWithQueries([
			{ query: 'INSERT INTO orders (user_id) VALUES (?)', duration: 1 }
		])

		expect(request.databaseQueries[0].shortQuery).toBe('INSERT INTO orders')
	})

	it('builds shortQuery for UPDATE', () => {
		const request = createRequestWithQueries([
			{ query: 'UPDATE users SET name = ? WHERE id = ?', duration: 1 }
		])

		expect(request.databaseQueries[0].shortQuery).toBe('UPDATE users')
	})

	it('builds shortQuery for DELETE', () => {
		const request = createRequestWithQueries([
			{ query: 'DELETE FROM users WHERE id = ?', duration: 1 }
		])

		expect(request.databaseQueries[0].shortQuery).toBe('DELETE FROM users')
	})

	it('falls back to full query for non-standard SQL', () => {
		const request = createRequestWithQueries([
			{ query: 'BEGIN', duration: 1 }
		])

		expect(request.databaseQueries[0].shortQuery).toBe('BEGIN')
	})
})

describe('processDatabase — counters', () => {
	it('counts selects, inserts, updates, deletes', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1 },
			{ query: 'INSERT INTO logs (msg) VALUES (?)', duration: 1 },
			{ query: 'UPDATE users SET name = ? WHERE id = ?', duration: 1 },
			{ query: 'DELETE FROM logs WHERE id = ?', duration: 1 },
			{ query: 'SELECT * FROM posts', duration: 1 }
		])

		expect(request.databaseSelects).toBe(2)
		expect(request.databaseInserts).toBe(1)
		expect(request.databaseUpdates).toBe(1)
		expect(request.databaseDeletes).toBe(1)
	})

	it('counts queries with prefix correctly', () => {
		const request = createRequestWithQueries([
			{ query: 'SELECT * FROM users', duration: 1 },
			{
				query: `DB\\Postgres\\QueryBuilder\\AtomicUpsert query: {\n  INSERT INTO document_status (document_id, user_id, status)\n  VALUES ($1::int, $2::int, $3::int)\n  ON CONFLICT (document_id, user_id) DO\n    UPDATE SET status = EXCLUDED.status\nWHERE D.status != $3::int\n}`,
				duration: 1
			}
		])

		expect(request.databaseSelects).toBe(1)
		expect(request.databaseInserts).toBe(1)
	})
})
