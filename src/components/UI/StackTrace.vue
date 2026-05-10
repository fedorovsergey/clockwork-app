<template>
	<div class="stack-trace popover-container">
		<div class="stack-trace-line" v-if="file || (trace && trace.length)">
			<a :href="$editorLink(file || trace?.[0]?.file, line || trace?.[0]?.line)">
				<shortened-text :full="trace ? shortPath : fullPath" @click.native="togglePopover($event)">{{shortPath}}</shortened-text>
			</a>
			<a
				href="#"
				class="stack-trace-copy"
				@click.prevent="copyFullPath"
				title="Copy full path with line"
			>
				<icon name="clipboard"></icon>
			</a>
		</div>

		<popover ref="popover" v-if="trace">
			<div v-for="frame in trace" class="stack-frame" :class="{'is-vendor':frame.isVendor}">
				<div class="stack-frame-call">{{ frame.call }}</div>
				<div class="stack-frame-file">
					<a :href="$editorLink(frame.file, frame.line)">
						<shortened-text :full="makeFullPath(frame.file, frame.line)">
							{{makeShortPath(frame.file, frame.line)}}
						</shortened-text>
					</a>
				</div>
			</div>
		</popover>
	</div>
</template>

<script>
import Popover from './Popover'
import ShortenedText from './ShortenedText'

export default {
	name: 'StackTrace',
	components: { Popover, ShortenedText },
	props: [ 'trace', 'file', 'line' ],
	computed: {
		fullPath() {
			return this.makeFullPath(
				this.file || this.trace?.[0]?.file,
				this.line || this.trace?.[0]?.line
			)
		},
		shortPath() {
			return this.makeShortPath(
				this.file || this.trace?.[0]?.file,
				this.line || this.trace?.[0]?.line
			)
		}
	},
	methods: {
		copyFullPath() {
			const file = this.file || this.trace?.[0]?.file
			const line = this.line || this.trace?.[0]?.line
			this.$copyText(this.makeCopyPath(file, line))
		},
		togglePopover($event) {
			if (! this.trace) return

			$event.preventDefault()

			this.$refs.popover.toggle()
		},
		// Copy only: drop first three path segments (e.g. /var/www/somehostname/… → …rest).
		makeCopyPath(file, line) {
			const norm = String(file ?? '').replace(/\\/g, '/')
			const parts = norm.split('/').filter(Boolean)
			const tail = parts.slice(3).join('/')
			const pathPart = tail || parts.join('/')
			return `${pathPart}:${line}`
		},
		makeFullPath(file, line) {
			return `${file}:${line}`
		},
		makeShortPath(file, line) {
			return this.makeFullPath(file, line).split(/[\/\\]/).pop()
		}
	}
}
</script>
