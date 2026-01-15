import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],

	webExt: {
		binaries: {
			chrome:
				'/Users/divinelight/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
		},
		startUrls: [
			'https://en.wikisource.org/wiki/Moby-Dick_(1851)_US_edition/Chapter_1',
		],
		disabled: false,
	},
	manifest: {
		description:
			'Read at 300-900 words per minute using the RSVP (Rapid Serial Visual Presentation) technique.',
		permissions: [
			'activeTab',
			'contextMenus',
			'clipboardWrite',
			'clipboardRead',
			'storage',
			'tabs',
			'scripting',
		],
		// Required, don't open popup, only action
		action: {},
		name:
			process.env.NODE_ENV === 'development'
				? 'Read for Speed (Dev)'
				: 'Read for Speed',
	},
})
