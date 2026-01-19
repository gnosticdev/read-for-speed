import ReactDOM from 'react-dom/client'

import '@/assets/tailwind.css'
import {
  DEFAULT_READER_SETTINGS,
  type ReaderSettings,
} from '@read-for-speed/speed-reader/rsvp-reader'
import ContentApp from '@/entrypoints/content/app'
import { sessionStats } from '@/lib/session-start-time'
import { SETTINGS_STORAGE_KEY } from './app'

/**
 * Content script entry point for the Read For Speed extension.
 *
 * This script:
 * 1. Evaluates page readability
 * 2. Creates a shadow DOM for isolated styling
 * 3. Mounts the React app with the ContentShellProvider
 */
export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const initialSettings = await storage.getItem<ReaderSettings>(`local:${SETTINGS_STORAGE_KEY}`, {
      fallback: DEFAULT_READER_SETTINGS,
    })

    const initialStats = await sessionStats.getValue()

    const ui = await createShadowRootUi(ctx, {
      name: 'read-for-speed-ui',
      position: 'modal',
      zIndex: 1000,
      isolateEvents: true,
      anchor: document.body,
      append: 'last',
      onMount: (uiContainer, shadowRoot, _shadowHost) => {
        // // Make the body transparent so no weird outline on button.
        // uiContainer.classList.add('bg-transparent')

        // Set dark mode class if system prefers dark color scheme.
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          uiContainer.classList.add('dark')
        }

        // Calculate where to show the button - either below header or 25% of viewport height.
        const headerHeight = document.querySelector('header')?.clientHeight ?? 0
        const top =
          headerHeight > window.innerHeight * 0.25 ? headerHeight : window.innerHeight * 0.25
        shadowRoot.querySelector('html')?.style.setProperty('right', '8px')
        shadowRoot.querySelector('html')?.style.setProperty('top', `${top}px`)
        shadowRoot.querySelector('html')?.style.setProperty('left', 'auto')
        shadowRoot.querySelector('html')?.style.setProperty('bottom', 'auto')
        shadowRoot.querySelector('html')?.style.setProperty('z-index', '1000')

        // Clone before we mount our app so we don't mutate the original document.
        const docClone = document.cloneNode(true) as Document

        const wrapper = document.createElement('div')
        uiContainer.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)

        // Render the app with the provider wrapping ContentApp.
        root.render(
          <>
            {initialSettings.showFloatingButton && <TriggerButton />}
            <ContentApp
              ctx={ctx}
              docClone={docClone}
              initialSettings={initialSettings}
              uiContainer={uiContainer}
              initialStats={initialStats}
            />
          </>,
        )

        return { root, wrapper }
      },
      onRemove: (mounted) => {
        if (!mounted) return
        mounted.root?.unmount()
        mounted.wrapper?.remove()
      },
    })

    ui.mount()
  },
})
