import { vi } from 'vitest'

vi.stubGlobal('ResizeObserver', class ResizeObserver {
	constructor(callback) {
		this.callback = callback
	}

	observe() {}

	unobserve() {}

	disconnect() {}
})

vi.stubGlobal('matchMedia', query => ({
	matches: false,
	media: query,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn()
}))
