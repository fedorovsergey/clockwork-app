import { describe, it, expect, beforeEach, vi } from 'vitest'

import { Filter } from '../../src/features/filter.js'

describe('Filter', () => {
	let filter

	beforeEach(() => {
		filter = new Filter(
			[
				{ tag: 'status', type: 'number' },
				{ tag: 'level' }
			],
			item => `${item.message} ${item.level}`
		)
	})

	it('tokenizes plain terms and tag filters', () => {
		expect(filter.tokenize('hello status:500 "quoted term"')).toEqual({
			terms: [ 'hello', 'quoted term' ],
			tags: {
				status: [ '500' ]
			}
		})
	})

	it('filters items by search terms', () => {
		const items = [
			{ message: 'User logged in', level: 'info' },
			{ message: 'Order failed', level: 'error' }
		]

		filter.input = 'order'
		expect(filter.filter(items)).toEqual([ items[1] ])
	})

	it('filters items by numeric tag conditions', () => {
		const items = [
			{ message: 'A', level: 'info', status: 404 },
			{ message: 'B', level: 'info', status: 500 }
		]

		filter.map = item => item
		filter.input = 'status:500'
		expect(filter.filter(items)).toEqual([ items[1] ])
	})

	it('sorts and reverses filtered items', () => {
		const items = [
			{ message: 'B', level: 'info', status: 2 },
			{ message: 'A', level: 'info', status: 1 }
		]

		filter.map = item => item
		filter.input = ''
		filter.sortBy('status')

		expect(filter.filter(items).map(item => item.message)).toEqual([ 'B', 'A' ])

		filter.sortBy('status')
		expect(filter.filter(items).map(item => item.message)).toEqual([ 'A', 'B' ])
	})
})
