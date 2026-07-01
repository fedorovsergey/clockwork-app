export default class PrettyJason
{
	constructor(data) {
		if (! (data instanceof Object)) {
			data = this.parseJson(data)
		}

		if (! (data instanceof Object)) {
			throw new PrettyJasonException('Input does not contain serialized object.')
		}

		this.data = data
	}

	parseJson(data) {
		try {
			return JSON.parse(data)
		} catch (e) {
			throw new PrettyJasonException('Input is not a valid JSON string.', e)
		}
	}

	print(target) {
		target.innerHTML = this.generateHtml()
	}

	generateHtml() {
		let [ value, valueType ] = this.resolveValueAndType(this.data)

		let ownKeys = this.getOwnKeys(this.data)
		let isArray = this.data instanceof Object && this.data.__type__ == 'array'
		let isSmallArray = isArray && ownKeys.length < 5

		let list = this.createElement('ul', { class: 'pretty-jason' }, [
			this.createElement('li', {}, [
				isSmallArray ? this.createElement('span', {}, [
					this.createElement('span', { class: 'pretty-jason-key', text: `${value} ` })
				]) : this.createElement('span', {
					data: { rendered: true },
					click: ev => this.objectNodeClickedCallback(ev)
				}, [
					this.createElement('span', { class: 'pretty-jason-icon', html: `<i class="${isSmallArray ? 'pretty-jason-icon-open' : 'pretty-jason-icon-closed'}"></i>` }),
					this.createElement('span', { text: `${value} ` })
				]),
				isSmallArray ? undefined : this.generateHtmlPreview(this.data),
				this.generateHtmlNode(this.data, isSmallArray)
			])
		])

		return list
	}

	getOwnKeys(data) {
		return Object.keys(data).filter(key => ! [ '__class__', '__type__', '__hash__' ].includes(key))
	}

	generateHtmlNode(data, expanded = false) {
		return this.createElement('ul', { style: { display: expanded ? 'block' : 'none' } }, Object.keys(data)
			.filter(key => ! [ '__class__', '__type__', '__hash__' ].includes(key))
			.map(key => {
				let [ value, valueType ] = this.resolveValueAndType(data[key])

				return this.createElement('li', { data: { key } }, [
					this.createElement('span', {
						click: valueType == 'object' ? (ev => this.objectNodeClickedCallback(ev)) : undefined
					}, [
						this.createElement('span', { class: 'pretty-jason-icon', html: valueType == 'object' ? '<i class="pretty-jason-icon-closed"></i>' : undefined }),
						this.createElement('span', { class: 'pretty-jason-key', text: `${key}: ` }),
						this.createElement('span', {
							class: `pretty-jason-value-${valueType}`,
							text: value
						})
					])
				])
			})
		)
	}

	generateHtmlPreview(data) {
		return this.createElement('span', { class: 'pretty-jason-preview' }, Object.keys(data)
			.filter(key => ! [ '__class__', '__type__', '__hash__' ].includes(key))
			.slice(0, 3)
			.map(key => {
				let [ value, valueType ] = this.resolveValueAndType(data[key])

				if (valueType == 'string' && value.length >= 104) value = value.substring(0, 101) + '…"'

				return this.createElement('span', { class: 'pretty-jason-preview-item' }, [
					this.createElement('span', { class: 'pretty-jason-key', text: `${key}: ` }),
					this.createElement('span', {
						class: `pretty-jason-value-${valueType}`,
						text: value
					})
				])
			})
			.concat(Object.keys(data).length > 3 ? [
				this.createElement('span', { class: 'pretty-jason-preview-item', text: '...' })
			] : [])
		)
	}

	resolveValueAndType(value) {
		if (value === null) {
			return [ 'null',  'null' ]
		} else if (value === undefined) {
			return [ 'undefined', 'undefined' ]
		} else if (typeof value == 'boolean') {
			return [ value ? 'true' : 'false', 'boolean' ]
		} else if (typeof value == 'string') {
			return [ `"${value}"`, 'string' ]
		} else if (typeof value == 'object') {
			if (value.__type__ == 'array') {
				return [ '', 'object' ]
			} else if (value.__type__ && value.__type__ != 'object') {
				return [ value.__type__, value.__type__.replace(' ', '-') ]
			} else {
				return [ value.__class__ || 'Object', 'object' ]
			}
		}

		return [ value.toString(), typeof value ]
	}

	objectNodeClickedCallback(ev) {
		let node = ev.currentTarget

		if (this.isNodeExpanded(node)) {
			this.collapseNode(node, ev.ctrlKey || ev.metaKey)
		} else {
			this.expandNode(node, ev.ctrlKey || ev.metaKey)
		}
	}

	isNodeExpanded(node) {
		let list = node.parentNode.querySelector('ul')

		return list && list.style.display != 'none'
	}

	expandNode(node, recursive) {
		this.renderObjectNode(node)

		let list = node.parentNode.querySelector('ul')
		let icon = node.querySelector('i')

		icon.classList.remove('pretty-jason-icon-closed', 'pretty-jason-icon-open')

		list.style.display = 'block'
		icon.classList.add('pretty-jason-icon-open')

		if (recursive) {
			list.querySelectorAll('.pretty-jason-icon-closed').forEach(closedIcon => {
				this.expandNode(closedIcon.parentNode.parentNode, recursive)
			})
		}
	}

	collapseNode(node, recursive) {
		let list = node.parentNode.querySelector('ul')
		let icon = node.querySelector('i')

		icon.classList.remove('pretty-jason-icon-closed', 'pretty-jason-icon-open')

		list.style.display = 'none'
		icon.classList.add('pretty-jason-icon-closed')

		if (recursive) {
			list.querySelectorAll('.pretty-jason-icon-open').forEach(openIcon => {
				this.collapseNode(openIcon.parentNode.parentNode, recursive)
			})
		}
	}

	renderObjectNode(node) {
		if (node.dataset.rendered) return

		let path = []

		let parent = node
		while (parent = parent.parentNode) {
			if (parent.tagName != 'LI' || ! ('key' in parent.dataset)) continue
			if (parent.classList.contains('pretty-jason')) break

			path.unshift(parent.dataset.key)
		}

		node.parentNode.append(this.generateHtmlNode(this.getDataFromPath(path)))
		node.dataset.rendered = true
	}

	getDataFromPath(path) {
		let data = this.data
		let segment

		while ((segment = path.shift()) !== undefined) {
			data = data[segment]
		}

		return data
	}

	createElement(name, options, children) {
		let element = document.createElement(name)

		if (options.html) element.innerHTML = options.html
		if (options.text) element.innerText = options.text

		if (options.class) element.classList.add(options.class)

		if (options.style instanceof Object) {
			Object.keys(options.style).forEach(key => element.style[key] = options.style[key])
		}

		if (options.data instanceof Object) {
			Object.keys(options.data).forEach(key => element.dataset[key] = options.data[key])
		}

		if (options.click) element.addEventListener('click', options.click)

		if (children instanceof Array) children.forEach(child => { if (child != null) element.append(child) })

		return element
	}
}

class PrettyJasonException {
	constructor (message, exception){
		this.message = message
		this.exception = exception
	}
}
