'use client'

import { isProbablyReaderable } from '@mozilla/readability'
import { RSVPProvider } from '@read-for-speed/speed-reader/provider'
import { type ReaderSettings, RSVPReader } from '@read-for-speed/speed-reader/rsvp-reader'
import type { ReadingStats } from '@read-for-speed/speed-reader/stats-panel'
import ContentDialog from '@/components/content-dialog'
import { parseWebPageContent } from '@/entrypoints/content/parse-page-content'
import { useOnMount } from '@/hooks/use-on-mount'
import type { RSVPReaderMessage } from '@/lib/message-types'
import { sessionStats } from '@/lib/session-stats'
import { readerSettings } from '@/lib/settings'

export const SETTINGS_STORAGE_KEY = 'read-for-speed:settings' as const

export default function ContentApp({
  docClone,
  initialSettings,
  initialStats,
  uiContainer,
}: {
  docClone: Document
  initialSettings: ReaderSettings
  initialStats: ReadingStats
  uiContainer: HTMLElement
}) {
  const [settings, setSettings] = useState<ReaderSettings>(initialSettings)
  const [pastedText, setPastedText] = useState<string | undefined>(undefined)
  const [openDialog, setOpenDialog] = useState(false)
  const [inputMode, setInputMode] = useState<'page' | 'paste'>('page')
  const [pageContent, setPageContent] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const controlsContainerRef = useRef<HTMLDivElement | null>(null)

  const parseAndSetPageContent = useCallback(
    (force = false) => {
      const isReaderable = isProbablyReaderable(docClone)
      if (isReaderable === false && force === false) {
        setError('Page is not reader mode compatible.')
        return
      }

      // will continue here if force = true or isReaderable = true
      const parsed = parseWebPageContent(docClone)
      if (parsed.error) {
        setError(parsed.message)
        return
      }

      setPageContent(parsed.textContent)
      setTitle(parsed.title)
      setError(null)
    },
    [docClone],
  )

  useOnMount(() => {
    parseAndSetPageContent()
  })

  /**
   * Handle settings changes from RSVPReader.
   * Updates local state and persists to browser storage.
   */
  const handleSettingsChange = useCallback(
    (newSettings: ReaderSettings) => {
      readerSettings.setValue(newSettings).then(() => {
        setSettings(newSettings)
      })
    },
    [settings],
  )

  const saveSessionStats = useCallback((stats: ReadingStats) => {
    void sessionStats.setValue(stats)
  }, [])

  const handleMessageEvent = useCallback((message: RSVPReaderMessage) => {
    console.log('message', message)

    switch (message.type) {
      case 'SHOW_READER_WITH_SELECTED_TEXT':
        setPastedText(message.payload)
        setInputMode('paste')
        setOpenDialog(true)
        break
      case 'SHOW_READER':
        setOpenDialog(true)
        break
    }
  }, [])

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleMessageEvent)
    return () => browser.runtime.onMessage.removeListener(handleMessageEvent)
  }, [handleMessageEvent])

  const content = inputMode === 'page' ? pageContent : (pastedText ?? '')

  return (
    <RSVPProvider
      content={content}
      chunkSize={settings.chunkSize}
      skipWords={settings.skipWords}
      wpm={settings.wpm}
    >
      <ContentDialog
        container={uiContainer}
        controlsContainerRef={controlsContainerRef}
        open={openDialog}
        onOpenChange={setOpenDialog}
        showFloatingButton={settings.showFloatingButton}
      >
        <RSVPReader
          pageContent={pageContent}
          onErrorResubmit={() => parseAndSetPageContent(true)}
          onPastedContentChange={setPastedText}
          readingStats={initialStats}
          onSessionStatsChange={saveSessionStats}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          pageContentTitle={title}
          pageContentError={error}
          initialPastedContent={pastedText}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          classNames={{
            container: 'h-full',
          }}
          controlPanelRef={controlsContainerRef}
        />
      </ContentDialog>
    </RSVPProvider>
  )
}
