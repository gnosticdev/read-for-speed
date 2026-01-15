import { isProbablyReaderable } from '@mozilla/readability'
import ReactDOM from 'react-dom/client'
import ContentApp from './ContentApp'

import '@/assets/tailwind.css'

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
      position: 'overlay',
      alignment: 'top-right',
      zIndex: 1000,
      // isolateEvents: true,

      anchor: document.body,
      append: 'last',
      onMount: (uiContainer, shadowRoot, shadowHost) => {
        if (!isProbablyReaderable(document)) {
          console.log(
            '%c [Read For Speed] Page is not readable, skipping...',
            'color: red; font-weight: bold;',
          )
          return
        }
        // uiContainer is the body. use it to set 'dark' class on html element
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          uiContainer.classList.add('dark')
        }
        // clone before we mount our app so we don't mutate the original document
        const docClone = document.cloneNode(true) as Document

        const wrapper = document.createElement('div')
        uiContainer.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)

        // set our root theme to the system theme
        root.render(
          <ContentApp
            docClone={docClone}
            anchor={uiContainer}
          />,
        )
        return { root, wrapper }
      },
      onRemove: (mounted) => {
        if (!mounted) return
        mounted.root.unmount()
        mounted.wrapper.remove()
      },
    })

    ui.mount()

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== 'RSVP_GET_PAGE_TEXT') return

      return Promise.resolve({
        text: document.body?.innerText ?? '',
        title: document.title ?? '',
      })
    })
  },
})
