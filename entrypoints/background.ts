import type { CustomMessages } from '@/lib/message-types'

export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id })

	browser.contextMenus.create({
		id: 'read-for-speed-context-menu',
		title: 'Read for Speed',
		type: 'normal',
		contexts: ['selection'],
		onclick: async (info, tab) => {
			console.log('context menu clicked,', info, tab)
			if (!tab?.id) return

			await browser.tabs.sendMessage<CustomMessages>(tab.id, {
				type: 'RSVP_GET_SELECTION_TEXT',
				payload: info.selectionText ?? '',
			})
		},
	})
})
