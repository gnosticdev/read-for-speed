import { isProbablyReaderable } from '@mozilla/readability'
import { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import ContentApp from './ContentApp'

import '@/assets/tailwind.css'
import type { CustomMessages } from '@/lib/message-types'

type ContentAppShellProps = {
  docClone: Document
  anchor: HTMLElement
}

function ContentAppShell({ docClone, anchor }: ContentAppShellProps) {
  const [selectionText, setSelectionText] = useState<string | null>(null)
  const [openOnSelection, setOpenOnSelection] = useState(false)

  const handleSelectionMessage = useCallback((message: CustomMessages) => {
    if (message?.type !== 'RSVP_GET_SELECTION_TEXT') return
    const nextSelection = message.payload?.trim() ?? ''
    if (!nextSelection) return

    // Use the highlighted selection for the reader and open the UI.
    setSelectionText(nextSelection)
    setOpenOnSelection(true)
  }, [])

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleSelectionMessage)
    return () => {
      browser.runtime.onMessage.removeListener(handleSelectionMessage)
    }
  }, [handleSelectionMessage])

  const handleSelectionHandled = useCallback(() => {
    setOpenOnSelection(false)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectionText(null)
  }, [])

  return (
    <ContentApp
      docClone={docClone}
      anchor={anchor}
      selectionText={selectionText}
      openOnSelection={openOnSelection}
      onSelectionHandled={handleSelectionHandled}
      onClearSelection={handleClearSelection}
    />
  )
}

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
          // make sure the overlay is removed
          // uiContainer.remove()
          // shadowHost.remove()
          // return { root: null, wrapper: null }
        }
        // make the body transparent so no weird outline on button
        uiContainer.classList.add('bg-transparent')
        // uiContainer is the body. use it to set 'dark' class on html element
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          uiContainer.classList.add('dark')
        }
        shadowHost.setAttribute(
          'data-theme',
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        )
        // calculate where to show the button - either below header or 25% of viewport height
        const headerHeight = document.querySelector('header')?.clientHeight ?? 0
        const top =
          headerHeight > window.innerHeight * 0.25 ? headerHeight : window.innerHeight * 0.25
        shadowRoot.querySelector('html')?.style.setProperty('right', '8px')
        shadowRoot.querySelector('html')?.style.setProperty('top', `${top}px`)
        shadowRoot.querySelector('html')?.style.setProperty('left', 'auto') // center
        shadowRoot.querySelector('html')?.style.setProperty('bottom', 'auto') // bottom
        shadowRoot.querySelector('html')?.style.setProperty('z-index', '1000')

        // clone before we mount our app so we don't mutate the original document
        const docClone = document.cloneNode(true) as Document

        const wrapper = document.createElement('div')
        uiContainer.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)

        // set our root theme to the system theme
        root.render(
          <ContentAppShell
            docClone={docClone}
            anchor={uiContainer}
          />,
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

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== 'RSVP_GET_PAGE_TEXT') return

      return Promise.resolve({
        text: document.body?.innerText ?? '',
        title: document.title ?? '',
      })
    })
  },
})
