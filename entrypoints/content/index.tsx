import ReactDOM from 'react-dom/client'
import ContentApp from './ContentApp'
import { Readability, isProbablyReaderable } from '@mozilla/readability'

import '@/assets/tailwind.css'

export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('Hello content script.', ctx.isValid)

    const ui = await createShadowRootUi(ctx, {
      name: 'read-for-speed-ui',
      position: 'overlay',
      alignment: 'top-right',
      zIndex: 1000,
      // isolateEvents: true,

      anchor() {
        if (document.querySelector('article')) {
          return document.querySelector('article')
        }
        if (document.querySelector('main')) {
          return document.querySelector('main')
        }
        return document.body
      },
      append: 'last',
      onMount: (uiContainer, shadowRoot, shadowHost) => {
        const isReadable = isProbablyReaderable(document)

        if (!isReadable) return

        const article = new Readability(document).parse()
        if (!article) {
          console.error('No article found')
          return null
        }

        const wrapper = document.createElement('div')
        uiContainer.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)
        root.render(
          <ContentApp
            article={article}
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
