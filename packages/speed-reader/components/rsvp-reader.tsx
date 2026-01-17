'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { extractContent } from '../lib/content-extractor'
import { ContentInput } from './content-input'
import { ControlPanel } from './control-panel'
import { SettingsPanel } from './settings-panel'
import { StatsPanel } from './stats-panel'
import { WordDisplay } from './word-display'

export type ReaderState = 'idle' | 'playing' | 'paused'

/**
 * Settings for the RSVP reader display and behavior.
 */
export interface ReaderSettings {
  wpm: number
  skipWords: number
  fontSize: number
  fontFamily: 'sans' | 'mono' | 'serif'
  showProgress: boolean
  focusAnimation: boolean
  /** Extension-specific: whether to use toolbar action instead of floating button. */
  usePageAction: boolean
}

/**
 * Statistics tracked during reading sessions.
 */
export interface ReadingStats {
  wordsRead: number
  totalWords: number
  sessionsCompleted: number
  averageWpm: number
  totalTimeSeconds: number
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
  /** CSS class for the container that wraps the reader. */
  containerClassName?: string
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
   * Option to show the control panel (default), or add the ControlPanel component manually
   * by passing a ref to the container element.
   * @default true
   */
  controlPanelRef?: RefObject<HTMLDivElement | null>
}

/**
 * Default settings for the RSVP reader.
 * Can be used by parent components as initial values.
 */
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  wpm: 300,
  skipWords: 1,
  fontSize: 48,
  fontFamily: 'sans',
  showProgress: true,
  focusAnimation: true,
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
  controlPanelRef: showControlPanel,
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

  const [words, setWords] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [state, setState] = useState<ReaderState>('idle')
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

  /**
   * Handles switching between page and paste input modes.
   */
  const handleInputModeChange = useCallback((mode: 'page' | 'paste') => {
    setInputMode(mode)
    // Reset reading position when switching modes.
    setCurrentIndex(0)
    setState('idle')
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
    setState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [pageContent, inputMode])

  /**
   * Update pasted content and switch to paste mode when initialPastedContent changes.
   * This handles new selection text while the reader is already open.
   */
  useEffect(() => {
    if (!initialPastedContent?.trim()) return

    setPastedContent(initialPastedContent)
    setInputMode('paste')
    setCurrentIndex(0)
    setState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [initialPastedContent])

  // Parse content into words/chunks
  useEffect(() => {
    const extracted = extractContent(content)
    const wordList = extracted.split(/\s+/).filter((w) => w.length > 0)
    setWords(wordList)
    setStats((prev) => ({ ...prev, totalWords: wordList.length }))
  }, [content])

  // Calculate interval based on WPM
  const getInterval = useCallback(() => {
    return 60000 / settings.wpm
  }, [settings.wpm])

  // Handle word progression
  useEffect(() => {
    if (state === 'playing' && words.length > 0) {
      if (sessionStartRef.current === null) {
        sessionStartRef.current = Date.now()
        wordsReadInSessionRef.current = 0
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= words.length - settings.skipWords) {
            // Session complete
            setState('idle')
            const sessionTime = (Date.now() - (sessionStartRef.current || Date.now())) / 1000
            setStats((s) => ({
              ...s,
              wordsRead: s.wordsRead + wordsReadInSessionRef.current + settings.skipWords,
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
          wordsReadInSessionRef.current += settings.skipWords
          return prev + settings.skipWords
        })
      }, getInterval())
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, words.length, settings.skipWords, getInterval])

  const handlePlay = () => {
    if (words.length === 0) return
    setState('playing')
  }

  const handlePause = () => {
    setState('paused')
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

  const handleStop = () => {
    setState('idle')
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (state === 'playing') {
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
          setCurrentIndex((i) => Math.max(0, i - settings.skipWords * 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentIndex((i) => Math.min(words.length - 1, i + settings.skipWords * 5))
          break
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          if (activePanel !== 'reader') {
            setActivePanel('reader')
          } else if (state === 'playing') {
            handlePause()
          } else {
            handleStop()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [activePanel, state, settings, words.length, onSettingsChange])

  const currentChunk = words.slice(currentIndex, currentIndex + settings.skipWords).join(' ')

  return (
    <Tabs
      value={activePanel}
      onValueChange={(value) => setActivePanel(value as 'reader' | 'settings' | 'stats')}
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
            <TabsTrigger value='reader'>Reader</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
            <TabsTrigger value='stats'>Stats</TabsTrigger>
          </TabsList>
        </header>

        {/* Main content area */}
        <TabsPanel
          value={'reader'}
          className='flex min-h-0 flex-1 flex-col'
        >
          {state === 'idle' && currentIndex === 0 ? (
            <ContentInput
              pastedContent={pastedContent}
              onPastedContentChange={handlePastedContentChange}
              onSelectPageContent={() => setInputMode('page')}
              pageContentTitle={pageContentTitle}
              pageContentError={pageContentError}
              pageContent={pageContent ?? ''}
              activeMode={inputMode}
              onModeChange={handleInputModeChange}
            />
          ) : (
            <WordDisplay
              word={currentChunk}
              settings={settings}
              isPlaying={state === 'playing'}
              onStop={handleStop}
            />
          )}
        </TabsPanel>

        <TabsPanel
          value={'settings'}
          className='flex min-h-0 flex-1 flex-col'
        >
          <SettingsPanel
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

        {/* Control panel */}
        {activePanel === 'reader' && showControlPanel && showControlPanel.current ? (
          <ControlPanel
            state={state}
            settings={settings}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSettingsChange={onSettingsChange}
            currentIndex={currentIndex}
            totalWords={words.length}
            onSeek={handleSeek}
            container={showControlPanel.current}
          />
        ) : null}
      </div>
    </Tabs>
  )
}
