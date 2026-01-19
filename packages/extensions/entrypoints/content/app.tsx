import { Readability } from '@mozilla/readability'
import { RSVPProvider } from '@read-for-speed/speed-reader/provider'
import { type ReaderSettings, RSVPReader } from '@read-for-speed/speed-reader/rsvp-reader'
import ContentDialog from '@/components/content-dialog'
import type { RSVPReaderMessage } from '@/lib/message-types'

export const SETTINGS_STORAGE_KEY = 'read-for-speed:settings' as const

export default function ContentApp({
  docClone,
  initialSettings,
  uiContainer,
}: {
  docClone: Document
  initialSettings: ReaderSettings
  uiContainer: HTMLElement
}) {
  const [settings, setSettings] = useState<ReaderSettings>(initialSettings)
  const [pastedText, setPastedText] = useState<string | undefined>(undefined)
  const [openDialog, setOpenDialog] = useState(false)

  const [content, setContent] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [totalWords, setTotalWords] = useState<number>(0)

  const controlsContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const article = new Readability(docClone).parse() // returns { textContent, ... }
    if (cancelled) return

    setContent(article?.textContent ?? '')
    setTitle(article?.title ?? docClone.title)
    setError(article ? null : 'No readable text found on this page.')
    setTotalWords(article?.textContent?.split(/\s+/).length ?? 0)

    return () => {
      cancelled = true
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

  const handleMessageEvent = useCallback((message: RSVPReaderMessage) => {
    if (!message) return

    switch (message.type) {
      case 'SHOW_READER_WITH_SELECTED_TEXT':
        setPastedText(message.payload)
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

  return (
    <RSVPProvider
      content={content}
      chunkSize={initialSettings.chunkSize}
      skipWords={initialSettings.skipWords}
      wpm={initialSettings.wpm}
    >
      <ContentDialog
        uiContainer={uiContainer}
        controlsContainerRef={controlsContainer}
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <RSVPReader
          pageContent={content}
          pageContentTitle={title}
          pageContentError={error}
          totalWords={totalWords}
          initialPastedContent={pastedText}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          classNames={{
            container: 'h-full',
          }}
          controlPanelRef={controlsContainer}
        />
      </ContentDialog>
    </RSVPProvider>
  )
}
