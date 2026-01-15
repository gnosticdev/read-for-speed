import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
	autoIcons: {
		baseIconPath: './assets/icons/app-icons',
	},

	webExt: {
		binaries: {
			chrome: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
		},
		startUrls: [
			'https://en.wikisource.org/wiki/Moby-Dick_(1851)_US_edition/Chapter_1',
		],
		disabled: false,
	},
	manifest: {
		permissions: ['activeTab'],
		// Required, don't open popup, only action
		action: {},
		name:
			process.env.NODE_ENV === 'development'
				? 'Read for Speed (Dev)'
				: 'Read for Speed',
	},
})
