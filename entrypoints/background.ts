import type { CustomMessages } from '@/lib/message-types'

export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id })

	browser.action.onClicked.addListener(async (tab) => {
		if (!tab?.id) return
		await browser.tabs.sendMessage<CustomMessages>(tab.id, {
			type: 'RSVP_MOUNT_UI',
		})
	})

	browser.runtime.onInstalled.addListener(async () => {
		browser.contextMenus.create({
			id: 'read-for-speed-context-menu',
			title: 'Read for Speed',
			type: 'normal',
			contexts: ['all'],
		})
		console.log('context menu created')
		browser.contextMenus.onClicked.addListener(async (info, tab) => {
			console.log('context menu clicked,', info, tab)
			if (!tab?.id) return

			await browser.tabs.sendMessage<CustomMessages>(tab.id, {
				type: 'RSVP_GET_SELECTION_TEXT',
				payload: info.selectionText ?? '',
			})
		})
	})
})
