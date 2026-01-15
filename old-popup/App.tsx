import { RSVPReader } from '@repo/speed-reader/components/rsvp-reader'
import { ThemeProvider } from '@repo/speed-reader/components/theme-provider'
import { useCallback, useState } from 'react'
import { browser } from 'wxt/browser'

type PageContentStatus = 'idle' | 'loading' | 'error' | 'ready'

function App() {
  const [pageContent, setPageContent] = useState<string | undefined>()
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')

  const handleUsePageContent = useCallback(async () => {
    setStatus('loading')
    setPageError(null)

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      setPageError('No active tab found.')
      setStatus('error')
      return
    }

    try {
      // Ask the content script for readable page text.
      const response = await browser.tabs.sendMessage(tab.id, { type: 'RSVP_GET_PAGE_TEXT' })
      const nextContent = response?.text ?? ''
      if (!nextContent.trim()) {
        setPageError('No readable text found on this page.')
        setStatus('error')
        return
      }

      setPageContent(nextContent)
      setPageTitle(response?.title ?? tab.title ?? null)
      setStatus('ready')
    } catch (error) {
      console.error('Failed to read page content:', error)
      setPageError('Unable to read this page. Try reloading the tab.')
      setStatus('error')
    }
  }, [])

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
    >
      <div className='h-full w-full'>
        <RSVPReader
          initialContent={pageContent}
          onUsePageContent={handleUsePageContent}
          pageContentStatus={status}
          pageContentTitle={pageTitle}
          pageContentError={pageError}
        />
      </div>
    </ThemeProvider>
  )
}

export default App
