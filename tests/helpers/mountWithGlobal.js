import { mount, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import lodashGet from 'lodash/get'

import { createMockGlobal } from './createMockGlobal.js'

export function mountWithGlobal(component, options = {}) {
	const { global: globalOverrides, shallow = false, stubs, ...mountOptions } = options
	const globalState = reactive(globalOverrides || createMockGlobal())

	const computed = Object.entries(globalState).reduce((result, [ key, value ]) => {
		result[key] = function () { return this.global[key] }
		return result
	}, {})

	const mountFn = shallow ? shallowMount : mount

	const wrapper = mountFn(component, {
		...mountOptions,
		global: {
			plugins: [ {
				install(app) {
					app.mixin({
						data: () => ({ global: globalState }),
						computed,
						methods: {
							$get: lodashGet,
							$shortClass: name => name?.split('\\').pop()
						}
					})
				}
			} ],
			...(mountOptions.global || {}),
			stubs: {
				icon: true,
				spinner: true,
				...stubs,
				...(mountOptions.global?.stubs || {})
			}
		}
	})

	return { wrapper, global: globalState }
}
