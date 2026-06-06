import clone from 'just-clone'

export const httpRequest = {
	id: 'req-http-1',
	type: 'request',
	time: 1710000000,
	method: 'GET',
	uri: '/users',
	url: 'http://localhost/users',
	controller: 'App\\Http\\Controllers\\UserController@index',
	responseStatus: 200,
	responseDuration: 125.5,
	databaseDuration: 12.3,
	memoryUsage: 2048000,
	headers: {
		'x-requested-with': 'XMLHttpRequest'
	},
	log: [],
	databaseQueries: [],
	modelsActions: [],
	cacheQueries: [],
	redisCommands: [],
	queueJobs: [],
	events: [],
	notifications: [],
	httpRequests: [],
	routes: [],
	userData: {},
	commandOutput: ''
}

export const commandRequest = {
	id: 'req-cmd-1',
	type: 'command',
	time: 1710000100,
	commandName: 'migrate',
	commandArguments: { force: true },
	commandOptions: { env: 'local' },
	commandExitCode: 0,
	responseDuration: 500,
	databaseDuration: 0,
	log: [],
	modelsActions: [],
	cacheQueries: [],
	databaseQueries: []
}

export const queueJobRequest = {
	id: 'req-queue-1',
	type: 'queue-job',
	time: 1710000200,
	jobName: 'App\\Jobs\\SendEmail',
	jobDescription: 'Send welcome email',
	jobStatus: 'processed',
	responseDuration: 80,
	databaseDuration: 5,
	log: [],
	modelsActions: [],
	cacheQueries: [],
	databaseQueries: []
}

export const testRequest = {
	id: 'req-test-1',
	type: 'test',
	time: 1710000300,
	testName: 'Feature\\UserTest::test_index',
	testStatus: 'passed',
	responseDuration: 45,
	databaseDuration: 2,
	log: [],
	modelsActions: [],
	cacheQueries: [],
	databaseQueries: []
}

export const richRequest = {
	id: 'req-rich-1',
	type: 'request',
	time: 1710000400,
	method: 'POST',
	uri: '/orders',
	url: 'http://localhost/orders',
	controller: 'App\\Http\\Controllers\\OrderController@store',
	responseStatus: 201,
	responseDuration: 250,
	databaseDuration: 40,
	memoryUsage: 4096000,
	log: [
		{ level: 'info', message: 'Order created', time: 1710000401 },
		{ level: 'warning', message: 'Slow query detected', time: 1710000402 }
	],
	databaseQueries: [
		{
			query: 'INSERT INTO orders (user_id) VALUES (?)',
			duration: 15,
			connection: 'mysql',
			model: 'App\\Models\\Order',
			tags: [ 'slow' ]
		}
	],
	databaseQueriesCount: 1,
	modelsRetrieved: { 'App\\Models\\User': 1 },
	modelsActions: [
		{ action: 'created', model: 'App\\Models\\Order', attributes: { id: 1 } }
	],
	cacheReads: 3,
	cacheHits: 2,
	cacheWrites: 1,
	cacheTime: 5,
	cacheQueries: [
		{ type: 'read', key: 'orders:1', value: null }
	],
	redisCommands: [
		{ command: 'GET', parameters: [ 'orders:1' ], duration: 1 }
	],
	queueJobs: [
		{ name: 'App\\Jobs\\ProcessOrder', description: 'Process order', status: 'pending' }
	],
	events: [
		{ event: 'OrderCreated', time: 1710000401, data: { __class__: 'OrderCreated' }, listeners: [] }
	],
	viewsData: {
		events: [
			{ name: 'orders.show', time: 1710000400, duration: 10 }
		]
	},
	notifications: [
		{ subject: 'Order confirmation', to: [ 'user@example.com' ], from: [ 'noreply@example.com' ], type: 'mail' }
	],
	httpRequests: [
		{
			request: { method: 'GET', url: 'http://api.example.com/status' },
			response: { status: 200 }
		}
	],
	routes: [
		{ method: 'POST', uri: '/orders', name: 'orders.store', action: 'OrderController@store' }
	],
	userData: {
		custom: {
			__meta: { title: 'Custom tab' },
			details: {
				__meta: { title: 'Details', showAs: 'counters' },
				count: 1
			}
		}
	},
	commandOutput: 'Deployment complete',
	headers: {}
}

export const authError = {
	error: 'requires-authentication',
	message: 'Authentication required',
	requires: [ 'username', 'password' ]
}

export const allRequests = [ httpRequest, commandRequest, queueJobRequest, testRequest ]

export function cloneMetadata(metadata) {
	return clone(metadata)
}
