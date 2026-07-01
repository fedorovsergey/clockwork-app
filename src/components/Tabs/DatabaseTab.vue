<template>
	<div v-if="active">
		<div class="counters-row">
			<div class="counter" :class="{ active: queryTypeFilter === null }" @click="queryTypeFilter = null">
				<div class="counter-value">{{$request.databaseQueriesCount}}</div>
				<div class="counter-title">queries</div>
			</div>
			<div class="counter database-slow-query" v-if="$request.databaseSlowQueries">
				<div class="counter-value">{{$request.databaseSlowQueries}}</div>
				<div class="counter-title has-mark">slow</div>
			</div>
			<div class="counter" :class="{ active: queryTypeFilter === 'select' }" @click="queryTypeFilter = 'select'" v-if="$request.databaseSelects">
				<div class="counter-value">{{$request.databaseSelects}}</div>
				<div class="counter-title">selects</div>
			</div>
			<div class="counter" :class="{ active: queryTypeFilter === 'insert' }" @click="queryTypeFilter = 'insert'" v-if="$request.databaseInserts">
				<div class="counter-value">{{$request.databaseInserts}}</div>
				<div class="counter-title">inserts</div>
			</div>
			<div class="counter" :class="{ active: queryTypeFilter === 'update' }" @click="queryTypeFilter = 'update'" v-if="$request.databaseUpdates">
				<div class="counter-value">{{$request.databaseUpdates}}</div>
				<div class="counter-title">updates</div>
			</div>
			<div class="counter" :class="{ active: queryTypeFilter === 'delete' }" @click="queryTypeFilter = 'delete'" v-if="$request.databaseDeletes">
				<div class="counter-value">{{$request.databaseDeletes}}</div>
				<div class="counter-title">deletes</div>
			</div>
			<div class="counter">
				<div class="counter-value">{{$request.databaseDurationRounded}}&nbsp;ms</div>
				<div class="counter-title">time</div>
			</div>
		</div>

		<details-table title="Queries" icon="database" :columns="columns" :items="filteredItems" :filter="filter" filter-example="where request_id model:request type:select file:Controller.php duration:&gt;100" v-if="$request.databaseQueries.length">
			<template v-slot:toolbar="{ filter }">
				<div class="header-group">
					<label class="header-toggle">
						<input type="checkbox" v-model="prettify">
						Prettify
					</label>
				</div>

				<div class="header-group">
					<div class="header-search">
						<input type="search" v-model="filter.input" placeholder="Search...">
						<icon name="search"></icon>
					</div>
				</div>
			</template>
			<template v-slot:body="{ items }">
				<tr v-for="query, index in items" :key="`${$request.id}-${index}`" :class="{ 'database-slow-query': query.tags.includes('slow') }">
					<td>
						<shortened-text :full="query.model">{{query.shortModel}}</shortened-text>
					</td>
					<td v-if="columns.includes('Connection')">{{query.connection}}</td>
					<td>
						<div class="database-query">
							<div class="database-query-content">
								<highlighted-code language="sql" :code="prettify ? query.prettifiedQuery : query.query"></highlighted-code>
								<div class="database-query-bindings" v-if="query.bindings">
									<pretty-print :data="query.bindings"></pretty-print>
								</div>
								<a href="#" class="database-query-copy" @click.prevent="copySqlWithBindings(query)" title="Copy SQL with bindings">📋</a>
							</div>
							<stack-trace class="database-query-path" :trace="query.trace" :file="query.file" :line="query.line"></stack-trace>
						</div>
					</td>
					<td class="database-duration">
						<span v-if="query.duration">{{$round(query.duration, 3)}} ms</span>
					</td>
				</tr>
			</template>
		</details-table>
	</div>
</template>

<script>
import DetailsTable from '../UI/DetailsTable'
import HighlightedCode from '../UI/HighlightedCode'
import PrettyPrint from '../UI/PrettyPrint'
import ShortenedText from '../UI/ShortenedText'
import StackTrace from '../UI/StackTrace'

import createFilter from '../../features/filter'

export default {
	name: 'DatabaseTab',
	components: { DetailsTable, HighlightedCode, PrettyPrint, ShortenedText, StackTrace },
	props: [ 'active' ],
	data: () => ({
		prettify: false,
		queryTypeFilter: null,
		filter: createFilter([
			{ tag: 'model' },
			{ tag: 'type', apply: (item, tagValue) => {
				if ([ 'select', 'update', 'insert', 'delete' ].includes(tagValue.toLowerCase())) {
					return item.query.match(new RegExp(`^${tagValue.toLowerCase()}`, 'i'))
				}
			} },
			{ tag: 'file', map: item => item.shortPath },
			{ tag: 'duration', type: 'number' }
		])
	}),
	computed: {
		filteredItems() {
			if (this.queryTypeFilter === null) return this.$request.databaseQueries

			return this.$request.databaseQueries.filter(item => item.type === this.queryTypeFilter)
		},
		columns() {
			let columns = [ 'Model', 'Query', 'Duration' ]

			let hasMultipleConnections = (new Set(this.$request.databaseQueries.map(query => query.connection))).size > 1

			if (hasMultipleConnections) columns.splice(1, 0, 'Connection')

			return columns
		}
	},
	watch: {
		prettify(val, old) {
			// skip initial assignment from settings
			if (old === undefined) return

			this.$settings.global.databasePrettified = this.prettify
			this.$settings.save()
		}
	},
	mounted() {
		this.prettify = this.$settings.global.databasePrettified || false
	},
	methods: {
		copySqlWithBindings(query) {
			let sql = query.query
			let bindings = query.bindings

			if (bindings) {
				let keys = Object.keys(bindings).filter(key => key != '__type__')

				if (keys.length) {
					// positional placeholders (?)
					if (keys.every(k => /^\d+$/.test(k))) {
						let values = keys.map(k => bindings[k])
						let i = 0
						sql = sql.replace(/\?/g, () => {
							let value = values[i++]
							// check if this ? is inside ANY(...)
							let match = sql.match(/ANY\(\?/)
							if (match) {
								// collect remaining values for the array
								let remaining = values.slice(i - 1)
								i = values.length
								return '{' + remaining.map(v => this.formatBindingValue(v, true)).join(',') + '}'
							}
							return this.formatBindingValue(value)
						})
					} else {
						// named placeholders (:user_id)
						keys.forEach(key => {
							let placeholder = key.startsWith(':') ? key : `:${key}`
							let value = this.formatBindingValue(bindings[key])
							sql = sql.split(placeholder).join(value)
						})
					}
				}
			}

			navigator.clipboard.writeText(sql)
		},
		formatBindingValue(value, insideArray = false) {
			if (value === null) return 'NULL'
			if (typeof value === 'boolean') return value ? '1' : '0'
			if (typeof value === 'number') return String(value)
			if (insideArray) return String(value)
			return `'${String(value).replace(/'/g, "\\'")}'`
		}
	}
}
</script>

<style lang="scss">
@use '../../mixins' as *;

.counter {
	cursor: pointer;
	user-select: none;

	&.active {
		background: var(--accent-color, hsl(210deg 100% 50%));
		color: #fff;
		border-radius: 4px;
	}
}

.counter.database-slow-query {
	.has-mark:before {
		background-color: hsl(27deg 55% 65%);
		@include dark { background-color: hsl(38deg 42% 38%); }
	}
}

.details-table table {
	tr.database-slow-query {
		background: rgb(255, 250, 226);
		color: rgb(168, 89, 25);

		&:nth-child(even) { background: hsl(50deg 100% 88%) !important; }

		.database-query-path > a { color: hsl(27deg 55% 65%) !important; }

		@include dark {
			background: hsl(50, 100%, 11%);
			color: rgb(250, 216, 159);

			&:nth-child(even) { background: hsl(50deg 100% 9%) !important; }

			.database-query-path > a { color: hsl(38deg 42% 48%) !important; }
		}
	}

	.database-query-bindings {
		margin-top: 2px;
	}

	.database-query-copy {
		color: #aaa;
		font-size: 13px;
		margin-left: 4px;
		opacity: 0.4;
		text-decoration: none;
		vertical-align: top;

		&:hover {
			opacity: 1;
		}

		@include dark {
			color: #777;
		}
	}
}
</style>
