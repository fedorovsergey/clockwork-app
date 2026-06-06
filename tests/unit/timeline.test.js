import { describe, it, expect } from 'vitest'

import { Timeline, TimelineEvent, TimelineEventGroup } from '../../src/features/timeline.js'
import { Filter } from '../../src/features/filter.js'

describe('Timeline', () => {
	it('sorts appended events by start time', () => {
		const timeline = new Timeline([], 0, 10)

		timeline.append({ description: 'Second', start: 5, duration: 1000 })
		timeline.append({ description: 'First', start: 1, duration: 1000 })

		expect(timeline.events.map(event => event.description)).toEqual([ 'First', 'Second' ])
	})

	it('condenses short events into groups', () => {
		const timeline = new Timeline([
			{ description: 'Long', start: 0, duration: 5000 },
			{ description: 'Short 1', start: 5000, duration: 50 },
			{ description: 'Short 2', start: 5050, duration: 50 }
		], 0, 10000)

		const condensed = timeline.condense()

		expect(condensed.events[0]).toBeInstanceOf(TimelineEvent)
		expect(condensed.events[1]).toBeInstanceOf(TimelineEventGroup)
		expect(condensed.events[1].condensed).toBe(true)
	})

	it('filters events using Filter and hidden tags', () => {
		const timeline = new Timeline([
			{ description: 'Visible', start: 0, duration: 1000, tags: [ 'app' ] },
			{ description: 'Hidden', start: 1000, duration: 1000, tags: [ 'db' ] }
		], 0, 5000)

		const filter = new Filter([], item => item.description)
		filter.input = 'Visible'

		const filtered = timeline.filter(filter, [ 'db' ])

		expect(filtered.events).toHaveLength(1)
		expect(filtered.events[0].description).toBe('Visible')
	})

	it('presents events with layout metrics', () => {
		const timeline = new Timeline([
			{ description: 'Event', start: 0, duration: 5000, color: 'blue' }
		], 0, 10000)

		const [ presented ] = timeline.present(800)

		expect(presented).toBeInstanceOf(TimelineEventGroup)
		expect(presented.width).toBeGreaterThan(0)
		expect(presented.groupStyle.width).toMatch(/px$/)
	})
})
