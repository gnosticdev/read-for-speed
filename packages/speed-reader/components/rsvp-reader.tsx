'use client'

import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@read-for-speed/ui/components/tabs'
import { cn } from '@read-for-speed/ui/lib/utils'
import { BookOpen, ChartBar, Settings } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chunkText } from '../lib/content-utils'
import { ContentInput } from './content-input'
import { ControlPanel } from './control-panel'
import { ReadingProgressBar } from './reading-progress-bar'
import { SettingsPanel } from './settings-panel'
import { type ReadingStats, StatsPanel } from './stats-panel'
import { WordDisplay } from './word-display'

export type ReaderState = 'idle' | 'playing' | 'paused' | 'done'

/**
 * Font size preset options for the RSVP reader.
 * The actual pixel size is calculated dynamically based on container width.
 */
export type FontSizePreset = 'sm' | 'md' | 'lg'

/**
 * Settings for the RSVP reader display and behavior.
 */
export interface ReaderSettings {
  wpm: number
  skipWords: number
  chunkSize: 1 | 2 | 3
  /**
   * Font size preset - the actual pixel size is calculated dynamically
   * based on container width to ensure text fits on a single line.
   */
  fontSizePreset: FontSizePreset
  fontFamily: 'sans' | 'mono' | 'serif'
  showProgress: boolean
  /** Extension-specific: whether to use toolbar action instead of floating button. */
  usePageAction: boolean
}

/**
 * Configuration for the RSVPReader component.
 * RSVPReader displays content using the RSVP (Rapid Serial Visual Presentation) technique.
 */
export interface RSVPReaderConfig {
  /**
   * Pre-extracted page content for the "page" tab.
   * This should be extracted outside the component (e.g., via Readability)
   * since extraction can be expensive.
   */
  pageContent?: string
  /** Title of the page content for display. */
  pageContentTitle?: string | null
  /** Error message if page content extraction failed. */
  pageContentError?: string | null
  /**
   * CSS classes for the rsvp reader components
   */
  classNames?: {
    container?: string
    controlPanelContainer?: string
    wordDisplayContainer?: string
    contentInputContainer?: string
    settingsPanelContainer?: string
    statsPanelContainer?: string
  }
  /**
   * Initial content for the "paste" tab.
   */
  initialPastedContent?: string
  /**
   * Callback when pasted content changes (from textarea input).
   */
  onContentChange?: (content: string) => void
  /**
   * Current reader settings. Settings updated from within the component will call `onSettingsChange`.
   */
  settings: ReaderSettings
  /**
   * Callback when settings change. Use to save settings in db/storage
   */
  onSettingsChange: (settings: ReaderSettings) => void
  /**
   * Ref to the container element for the control panel.
   * Control panel will be rendered at the bottom of the `reader` tab if no ref is provided.
   */
  controlPanelRef?: RefObject<HTMLDivElement | null>
  /**
   * Callback when reader state changes.
   */
  onReaderStateChange?: (state: ReaderState) => void
}

/**
 * Default settings for the RSVP reader.
 * Can be used by parent components as initial values.
 */
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  wpm: 300,
  skipWords: 10,
  chunkSize: 1,
  fontSizePreset: 'md',
  fontFamily: 'sans',
  showProgress: true,
  usePageAction: false,
}

const SAMPLE_TEXT = `Speed reading is a collection of methods that attempt to increase rates of reading without significantly reducing comprehension or retention. Methods include chunking and minimizing subvocalization. The many speed reading training programs available include books, videos, software, and seminars.

The scientific consensus is that reading faster results in reading less accurately and that the average college-level reader reads at about 200 to 400 words per minute. The concept of speed reading challenges some of these assumptions by proposing techniques that suppress subvocalization and use peripheral vision more efficiently.

RSVP, or Rapid Serial Visual Presentation, is a technique that displays text one word at a time in a fixed focal position. This eliminates the need for eye movement and can significantly increase reading speed while maintaining comprehension when properly implemented.`

/**
 * RSVP (Rapid Serial Visual Presentation) speed reader component.
 *
 * This is a pure, environment-agnostic component that accepts all configuration
 * via props. It does not access browser storage or external contexts, making it
 * suitable for use in browser extensions, web apps, or any React environment.
 *
 * @example
 * ```tsx
 * // In a browser extension
 * <RSVPReader
 *   pageContent={extractedContent}
 *   pageContentTitle="Article Title"
 *   settings={settings}
 *   onSettingsChange={(newSettings) => {
 *     setSettings(newSettings)
 *     storage.setItem('settings', newSettings)
 *   }}
 * />
 *
 * // In a web app
 * <RSVPReader
 *   pageContent={articleText}
 *   settings={userSettings}
 *   onSettingsChange={async (newSettings) => {
 *     setSettings(newSettings)
 *     await saveSettingsToDatabase(newSettings)
 *   }}
 * />
 * ```
 */
export function RSVPReader({
  pageContent,
  pageContentTitle,
  pageContentError,
  initialPastedContent,
  onContentChange,
  settings,
  onSettingsChange,
  controlPanelRef,
  onReaderStateChange,
  classNames,
}: RSVPReaderConfig) {
  /**
   * The currently active input mode determines which content source is used for reading.
   * - 'page': Uses the extracted page content.
   * - 'paste': Uses user-provided pasted content (including selection text).
   *
   * Defaults to 'paste' if there's initial pasted content (e.g., selection text),
   * otherwise defaults to 'page'
   */
  const [inputMode, setInputMode] = useState<'page' | 'paste'>(() => {
    if (initialPastedContent?.trim()) {
      return 'paste'
    }
    return 'page'
  })

  /**
   * User-provided pasted content, independent from page content.
   * Initialized with selection text if provided.
   */
  const [pastedContent, setPastedContent] = useState(initialPastedContent ?? '')

  /**
   * The content that will be used for reading, derived from the active input mode.
   */
  const content = inputMode === 'page' ? (pageContent ?? '') : pastedContent || SAMPLE_TEXT

  const [currentIndex, setCurrentIndex] = useState(0)
  const [readerState, setReaderState] = useState<ReaderState>('idle')
  const [activePanel, setActivePanel] = useState<'reader' | 'settings' | 'stats'>('reader')
  const [stats, setStats] = useState<ReadingStats>({
    wordsRead: 0,
    totalWords: 0,
    sessionsCompleted: 0,
    averageWpm: 0,
    totalTimeSeconds: 0,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number | null>(null)
  const wordsReadInSessionRef = useRef(0)

  /**
   * Handles changes to the pasted content from the textarea.
   */
  const handlePastedContentChange = useCallback(
    (nextContent: string) => {
      setPastedContent(nextContent)
      onContentChange?.(nextContent)
    },
    [onContentChange],
  )

  useEffect(() => {
    onReaderStateChange?.(readerState)
  }, [readerState])

  /**
   * Handles switching between page and paste input modes.
   */
  const handleInputModeChange = useCallback((mode: 'page' | 'paste') => {
    setInputMode(mode)
    // Reset reading position when switching modes.
    setCurrentIndex(0)
    setReaderState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [])

  /**
   * Reset reading state when page content changes.
   */
  useEffect(() => {
    if (inputMode !== 'page') return
    if (typeof pageContent !== 'string' || !pageContent.trim()) return

    // Reset reading position when page content is updated.
    setCurrentIndex(0)
    setReaderState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [pageContent, inputMode])

  /**
   * Memoized chunks of the content, split by chunkSize (1/2/3 words per chunk).
   * This is memoized because content can be very large (200k+ words for books).
   */
  const chunks = useMemo(
    () => chunkText(content, settings.chunkSize),
    [content, settings.chunkSize],
  )

  /**
   * Update pasted content and switch to paste mode when initialPastedContent changes.
   * This handles new selection text while the reader is already open.
   */
  useEffect(() => {
    if (!initialPastedContent?.trim()) return

    setPastedContent(initialPastedContent)
    setInputMode('paste')
    setCurrentIndex(0)
    setReaderState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [initialPastedContent])

  /**
   * Update total word count in stats when chunks change.
   */
  useEffect(() => {
    setStats((prev) => ({ ...prev, totalWords: chunks.length }))
  }, [chunks.length])

  // Calculate interval based on WPM
  const getInterval = useCallback(() => {
    return 60000 / settings.wpm
  }, [settings.wpm])

  /**
   * Handle chunk progression during playback.
   * Advances one chunk at a time based on WPM.
   * Note: skipWords is only used for manual skip forward/back, not playback.
   */
  useEffect(() => {
    if (readerState === 'playing' && chunks.length > 0) {
      if (sessionStartRef.current === null) {
        sessionStartRef.current = Date.now()
        wordsReadInSessionRef.current = 0
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= chunks.length - 1) {
            // Session complete
            setReaderState('done')
            const sessionTime = (Date.now() - (sessionStartRef.current || Date.now())) / 1000
            setStats((s) => ({
              ...s,
              wordsRead: s.wordsRead + wordsReadInSessionRef.current + 1,
              sessionsCompleted: s.sessionsCompleted + 1,
              totalTimeSeconds: s.totalTimeSeconds + sessionTime,
              averageWpm: Math.round(
                ((s.wordsRead + wordsReadInSessionRef.current) /
                  (s.totalTimeSeconds + sessionTime)) *
                  60,
              ),
            }))
            sessionStartRef.current = null
            return 0
          }
          wordsReadInSessionRef.current += 1
          return prev + 1
        })
      }, getInterval())
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [readerState, chunks.length, getInterval])

  const handlePlay = () => {
    if (chunks.length === 0) return
    setReaderState('playing')
  }

  const handlePause = () => {
    setReaderState('paused')
    if (sessionStartRef.current) {
      const sessionTime = (Date.now() - sessionStartRef.current) / 1000
      setStats((s) => ({
        ...s,
        wordsRead: s.wordsRead + wordsReadInSessionRef.current,
        totalTimeSeconds: s.totalTimeSeconds + sessionTime,
      }))
      sessionStartRef.current = null
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
  }

  const handleStop = () => {
    setReaderState('idle')
    setCurrentIndex(0)
    if (sessionStartRef.current) {
      const sessionTime = (Date.now() - sessionStartRef.current) / 1000
      setStats((s) => ({
        ...s,
        wordsRead: s.wordsRead + wordsReadInSessionRef.current,
        totalTimeSeconds: s.totalTimeSeconds + sessionTime,
      }))
      sessionStartRef.current = null
    }
    wordsReadInSessionRef.current = 0
  }

  const handleSeek = (index: number) => {
    setCurrentIndex(index)
  }

  /**
   * Keyboard shortcuts for reader control.
   * - Space: Play/Pause
   * - Arrow Up/Down: Adjust WPM
   * - Arrow Left/Right: Skip backward/forward by skipWords chunks
   * - Escape: Stop or close panels
   */
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (readerState === 'playing') {
            handlePause()
          } else {
            handlePlay()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          onSettingsChange({ ...settings, wpm: Math.min(1000, settings.wpm + 25) })
          break
        case 'ArrowDown':
          e.preventDefault()
          onSettingsChange({ ...settings, wpm: Math.max(50, settings.wpm - 25) })
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentIndex((i) => Math.max(0, i - settings.skipWords))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentIndex((i) => Math.min(chunks.length - 1, i + settings.skipWords))
          break
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          if (activePanel !== 'reader') {
            setActivePanel('reader')
          } else if (readerState === 'playing') {
            handlePause()
          } else {
            handleStop()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [activePanel, readerState, settings, chunks.length, onSettingsChange])

  /** The current chunk to display, retrieved from the memoized chunks array. */
  const currentChunk = chunks[currentIndex] ?? ''

  return (
    <Tabs
      value={activePanel}
      onValueChange={(value) => setActivePanel(value as 'reader' | 'settings' | 'stats')}
      className={cn('@container/reader-main', classNames?.container)}
    >
      <div className={cn('flex min-h-0 flex-col')}>
        {/* Header */}
        <header className='flex items-center justify-between px-6 py-4 border-b'>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg/tight font-semibold truncate max-w-[200px]'>
              {pageContentTitle}
            </h1>
          </div>
          <TabsList variant='underline'>
            {/* Only show icons on mobile */}
            <TabsTrigger value='reader'>
              <BookOpen className='size-4 @md/reader-main:hidden' />
              <span className='@max-md/reader-main:hidden'>Reader</span>
            </TabsTrigger>
            <TabsTrigger value='settings'>
              <Settings className='size-4 @md/reader-main:hidden' />
              <span className='@max-md/reader-main:hidden'>Settings</span>
            </TabsTrigger>
            <TabsTrigger value='stats'>
              <ChartBar className='size-4 @md/reader-main:hidden' />
              <span className='@max-md/reader-main:hidden'>Stats</span>
            </TabsTrigger>
          </TabsList>
        </header>

        {/* Main content area */}
        <TabsPanel
          value={'reader'}
          className='flex min-h-0 flex-1 flex-col'
        >
          {readerState === 'idle' && currentIndex === 0 ? (
            <ContentInput
              pastedContent={pastedContent}
              onPastedContentChange={handlePastedContentChange}
              onSelectPageContent={() => setInputMode('page')}
              pageContentTitle={pageContentTitle}
              pageContentError={pageContentError}
              pageContent={pageContent ?? ''}
              activeMode={inputMode}
              onModeChange={handleInputModeChange}
              className={classNames?.contentInputContainer}
            />
          ) : (
            <WordDisplay
              currentChunk={currentChunk}
              settings={settings}
              isPlaying={readerState === 'playing'}
              onStop={handleStop}
            />
          )}
          {/* Control panel shows on both overlay and page layouts */}

          <div className='flex flex-col gap-2'>
            <ControlPanel
              state={readerState}
              onReset={handleReset}
              settings={settings}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSettingsChange={onSettingsChange}
              currentIndex={currentIndex}
              totalWords={chunks.length}
              onSeek={handleSeek}
              container={controlPanelRef?.current}
            >
              {settings.showProgress && (
                <ReadingProgressBar
                  currentIndex={currentIndex}
                  totalWords={chunks.length}
                />
              )}
            </ControlPanel>
          </div>
        </TabsPanel>

        <TabsPanel
          value={'settings'}
          className='flex min-h-0 flex-1 flex-col'
        >
          <SettingsPanel
            popoverAnchor={controlPanelRef?.current}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onSave={() => setActivePanel('reader')}
            layout='page'
          />
        </TabsPanel>

        <TabsPanel
          value={'stats'}
          className='flex min-h-0 flex-1 flex-col'
        >
          <StatsPanel
            stats={stats}
            onClose={() => setActivePanel('reader')}
            layout='page'
          />
        </TabsPanel>
      </div>
    </Tabs>
  )
}
