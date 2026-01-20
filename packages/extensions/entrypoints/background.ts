import type { RSVPReaderMessage } from '@/lib/message-types'
import { sessionStats } from '@/lib/session-stats'

export default defineBackground(() => {
	void sessionStats.setValue({
		wordsRead: 0,
		totalWords: 0,
		sessionsCompleted: 0,
		averageWpm: 0,
		totalTimeSeconds: 0,
	})

	// Set the access level so `browser.storage.session` is defined and availble
	// in content scripts: https://developer.chrome.com/docs/extensions/reference/api/storage#storage_areas
	void browser.storage.session.setAccessLevel?.({
		accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
	})

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
