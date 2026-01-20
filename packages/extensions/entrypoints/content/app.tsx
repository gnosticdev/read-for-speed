import { isProbablyReaderable, Readability } from '@mozilla/readability'
import { RSVPProvider } from '@read-for-speed/speed-reader/provider'
import { type ReaderSettings, RSVPReader } from '@read-for-speed/speed-reader/rsvp-reader'
import type { ReadingStats } from '@read-for-speed/speed-reader/stats-panel'
import type { ContentScriptContext } from '#imports'
import ContentDialog from '@/components/content-dialog'
import type { RSVPReaderMessage } from '@/lib/message-types'
import { sessionStats } from '@/lib/session-stats'

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
  ctx: ContentScriptContext
}) {
  const [settings, setSettings] = useState<ReaderSettings>(initialSettings)
  const [pastedText, setPastedText] = useState<string | undefined>(undefined)
  const [openDialog, setOpenDialog] = useState(false)
  const [inputMode, setInputMode] = useState<'page' | 'paste'>('page')

  const [pageContent, setPageContent] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [totalWords, setTotalWords] = useState<number>(0)

  const controlsContainerRef = useRef<HTMLDivElement | null>(null)

  const parseWebPageContent = useCallback((newDoc: Document) => {
    const article = new Readability(newDoc).parse() // returns { textContent, ... }

    setPageContent(article?.textContent ?? '')
    setTitle(article?.title ?? newDoc.title)
    setError(article ? null : 'No readable text found on this page.')
    setTotalWords(article?.textContent?.split(/\s+/).length ?? 0)
  }, [])

  useEffect(() => {
    if (isProbablyReaderable(docClone)) {
      parseWebPageContent(docClone)
    } else {
      setError('Page is not reader mode compatible.')
    }
  }, [])

  /**
   * Handle settings changes from RSVPReader.
   * Updates local state and persists to browser storage.
   */
  const handleSettingsChange = useCallback(
    (newSettings: ReaderSettings) => {
      setSettings(newSettings)
      void storage.setItem(`local:${SETTINGS_STORAGE_KEY}`, newSettings)
    },
    [settings],
  )

  const saveSessionStats = useCallback((stats: ReadingStats) => {
    void sessionStats.setValue(stats)
  }, [])

  const handleMessageEvent = useCallback((message: RSVPReaderMessage) => {
    if (!message) return

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
        uiContainer={uiContainer}
        controlsContainerRef={controlsContainerRef}
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <RSVPReader
          pageContent={pageContent}
          onPastedContentChange={setPastedText}
          initialStats={initialStats}
          onSessionStatsChange={saveSessionStats}
          contentMode={inputMode}
          onContentModeChange={setInputMode}
          pageContentTitle={title}
          pageContentError={error}
          totalWords={totalWords}
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
