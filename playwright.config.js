import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:5173'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }
	],
	webServer: {
		command: 'npx vite --host 127.0.0.1 --port 5173',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		stdout: 'pipe',
		stderr: 'pipe'
	}
})
