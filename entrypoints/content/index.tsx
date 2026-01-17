import { isProbablyReaderable } from '@mozilla/readability'
import ReactDOM from 'react-dom/client'
import ContentApp from './ContentApp'

import '@/assets/tailwind.css'
import { ContentScriptProvider } from '@/components/provider'

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
    console.log(
      '%c Evaluating page for readability...',
      'color: var(--primary); font-weight: bold;',
    )

    const ui = await createShadowRootUi(ctx, {
      name: 'read-for-speed-ui',
      position: 'modal',
      zIndex: 1000,
      isolateEvents: true,

      anchor: document.body,
      append: 'last',
      onMount: (uiContainer, shadowRoot, shadowHost) => {
        const isReadable = isProbablyReaderable(document)
        if (!isReadable) {
          console.log(
            '%c [Read For Speed] Page is not readable, skipping...',
            'color: red; font-weight: bold;',
          )
        }

        // Make the body transparent so no weird outline on button.
        uiContainer.classList.add('bg-transparent')

        // Set dark mode class if system prefers dark color scheme.
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          uiContainer.classList.add('dark')
        }

        shadowHost.setAttribute(
          'data-theme',
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        )

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
          <ContentScriptProvider
            docClone={docClone}
            anchor={uiContainer}
          >
            <ContentApp />
          </ContentScriptProvider>,
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
