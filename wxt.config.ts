import tailwind from '@tailwindcss/vite'
import { defineConfig } from 'wxt'
import os from 'node:os'

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],

	webExt: {
		binaries: {
			chrome: `${os.homedir()}/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
		},
		startUrls: [
			'https://en.wikisource.org/wiki/Moby-Dick_(1851)_US_edition/Chapter_1',
		],
		disabled: false,
	},
	manifest: {
		description:
			'Speed read at 300-1000 words per minute using the RSVP (Rapid Serial Visual Presentation) technique. Perfect for books, articles, or any long form content.',
		version: '1.0.0',
		author: {
			email: '64601257+gnosticdev@users.noreply.github.com',
		},
		homepage_url: 'https://github.com/gnosticdev/read-for-speed',
		short_name: 'Read for Speed',

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
				: 'Read for Speed - RSVP Reader',
	},
	vite: () => ({
		plugins: [tailwind()],
	}),
})
