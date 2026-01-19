import type { RSVPReaderMessage } from '@/lib/message-types'

export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id })

	browser.action.onClicked.addListener(async (tab) => {
		if (!tab?.id) return
		await browser.tabs.sendMessage<RSVPReaderMessage>(tab.id, {
			type: 'SHOW_READER',
		})
	})

	browser.runtime.onInstalled.addListener(async () => {
		browser.contextMenus.create({
			id: 'read-for-speed-context-menu',
			title: 'Read for Speed',
			type: 'normal',
			contexts: ['selection', 'page'],
		})
		console.log('context menu created')
		browser.contextMenus.onClicked.addListener(async (info, tab) => {
			console.log('context menu clicked,', info, tab)
			if (!tab?.id) return

			if (info.selectionText) {
				await browser.tabs.sendMessage<RSVPReaderMessage>(tab.id, {
					type: 'SHOW_READER_WITH_SELECTED_TEXT',
					payload: info.selectionText ?? '',
				})
			} else {
				await browser.tabs.sendMessage<RSVPReaderMessage>(tab.id, {
					type: 'SHOW_READER',
				})
			}
		})
	})
})
