'use client'

import { ContentInput } from '@read-for-speed/speed-reader/content-input'
import { ControlPanel } from '@read-for-speed/speed-reader/control-panel'
import { useRSVPControls, useRSVPView } from '@read-for-speed/speed-reader/provider'
import { ReadingProgressBar } from '@read-for-speed/speed-reader/reading-progress-bar'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@read-for-speed/ui/components/tabs'
import { cn } from '@read-for-speed/ui/lib/utils'
import { BookOpen, ChartBar, Settings } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useControllableState } from '../internal/use-controllable-state'
import { SettingsPanel } from './settings-panel'
import { DEFAULT_READING_STATS, type ReadingStats, StatsPanel } from './stats-panel'
import { WordDisplay } from './word-display'

export type ReaderState = 'idle' | 'playing' | 'paused' | 'done'

/**
 * Font size preset options for the RSVP reader.
 * The actual pixel size is calculated dynamically based on container width.
 */
export type FontSizePreset = 'sm' | 'md' | 'lg'
export type FontFamily = 'sans' | 'mono' | 'serif'
export type ChunkSize = 1 | 2 | 3

export type PanelState = 'reader' | 'settings' | 'stats'
/**
 * Settings for the RSVP reader display and behavior.
 */
export interface ReaderSettings {
  wpm: number
  skipWords: number
  chunkSize: ChunkSize
  /**
   * Font size preset - the actual pixel size is calculated dynamically
   * based on container width to ensure text fits on a single line.
   */
  fontSizePreset: FontSizePreset
  fontFamily: FontFamily
  showProgress: boolean
  /** Show a floating button - usefule when mounting the reader to a dialog */
  showFloatingButton: boolean
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
   * Controlled input mode.
   */
  inputMode?: 'page' | 'paste'
  /**
   * Callback when input mode changes.
   */
  onInputModeChange?: (mode: 'page' | 'paste') => void
  /**
   * Initial content for the "paste" tab.
   */
  initialPastedContent?: string
  /**
   * Callback when pasted content changes (from textarea input).
   */
  onPastedContentChange?: (content: string) => void
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
  /**
   * Reading stats displayed in the stats panel.
   */
  readingStats?: ReadingStats
  /**
   * Callback when session stats change.
   */
  onSessionStatsChange?: (stats: ReadingStats) => void
  /**
   * Callback when an error is presented and the user clicks the `Try Again` button.
   */
  onErrorResubmit?: () => void
  /**
   * Ref to the container element for the reader. Used for keyboard shortcuts in the control panel. Use if reader not mounted to the body, such as a dialog
   */
  containerRef?: RefObject<HTMLDivElement | null>
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
  showFloatingButton: false,
}

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
  onPastedContentChange,
  settings,
  onSettingsChange,
  controlPanelRef,
  classNames,
  containerRef,
  inputMode,
  onInputModeChange,
  onSessionStatsChange,
  readingStats,
  onErrorResubmit,
  onReaderStateChange,
}: RSVPReaderConfig) {
  /**
   * The currently active input mode determines which content source is used for reading.
   * - 'page': Uses the extracted page content.
   * - 'paste': Uses user-provided pasted content (including selection text).
   *
   * Defaults to 'paste' if there's initial pasted content (e.g., selection text),
   * otherwise defaults to 'page'
   */
  const [internalInputMode, setInternalInputMode] = useControllableState<'page' | 'paste'>({
    value: inputMode,
    defaultValue: 'page',
    onChange: onInputModeChange,
  })

  /**
   * User-provided pasted content, independent from page content.
   * Initialized with selection text if provided.
   */
  const [pastedContent, _setPastedContent] = useState(initialPastedContent ?? '')

  const { words: chunkWords, wordIndex, wordCountIndexed, totalWords, readerState } = useRSVPView()
  const { pause, play, setWordIndex, skipForward, skipBack, stop } = useRSVPControls()

  const [activePanel, setActivePanel] = useState<PanelState>('reader')
  const [stats, setStats] = useState<ReadingStats>(readingStats ?? DEFAULT_READING_STATS)

  const isPlaying = readerState === 'playing'

  const sessionStartRef = useRef<number | null>(null)
  const sessionElapsedRef = useRef(0)
  const wordsReadInSessionRef = useRef(0)
  const committedWordsRef = useRef(0)
  const committedTimeRef = useRef(0)
  const lastWordIndexRef = useRef(wordIndex)

  const resetSessionTracking = useCallback(() => {
    sessionStartRef.current = null
    sessionElapsedRef.current = 0
    wordsReadInSessionRef.current = 0
    committedWordsRef.current = 0
    committedTimeRef.current = 0
    lastWordIndexRef.current = 0
  }, [])

  const commitSessionStats = useCallback(
    (completeSession: boolean) => {
      const activeSessionTime =
        sessionStartRef.current != null ? (Date.now() - sessionStartRef.current) / 1000 : 0
      const sessionTime = sessionElapsedRef.current + activeSessionTime

      const deltaWords = Math.max(0, wordsReadInSessionRef.current - committedWordsRef.current)
      const deltaTime = Math.max(0, sessionTime - committedTimeRef.current)
      const shouldComplete =
        completeSession && (wordsReadInSessionRef.current > 0 || sessionTime > 0)

      if (deltaWords === 0 && deltaTime === 0 && !shouldComplete) return

      setStats((prev) => {
        const nextWordsRead = prev.wordsRead + deltaWords
        const nextTime = prev.totalTimeSeconds + deltaTime
        const nextSessions = prev.sessionsCompleted + (shouldComplete ? 1 : 0)
        const nextAverageWpm = nextTime > 0 ? Math.round((nextWordsRead / nextTime) * 60) : 0

        return {
          ...prev,
          wordsRead: nextWordsRead,
          totalTimeSeconds: nextTime,
          sessionsCompleted: nextSessions,
          averageWpm: nextAverageWpm,
          totalWordsRead: totalWords,
        }
      })

      committedWordsRef.current = wordsReadInSessionRef.current
      committedTimeRef.current = sessionTime
    },
    [totalWords],
  )

  // sync stats to parent
  useEffect(() => {
    onSessionStatsChange?.(stats)
  }, [stats, onSessionStatsChange])

  // track words read in session
  useEffect(() => {
    if (!isPlaying) {
      lastWordIndexRef.current = wordIndex
      return
    }

    const prevIndex = lastWordIndexRef.current
    if (wordIndex > prevIndex) {
      wordsReadInSessionRef.current += wordIndex - prevIndex
    }
    lastWordIndexRef.current = wordIndex
  }, [isPlaying, wordIndex])

  /**
   * Handles changes to the pasted content from the textarea.
   */
  const handlePastedContentChange = useCallback(
    (nextContent: string) => {
      _setPastedContent(nextContent)
      onPastedContentChange?.(nextContent)
    },
    [onPastedContentChange],
  )

  /**
   * Handles switching between page and paste input modes.
   */
  const handleInputModeChange = useCallback(
    (mode: 'page' | 'paste') => {
      setInternalInputMode(mode)
      // Reset reading position when switching modes.
      setWordIndex(0)
      stop()
      resetSessionTracking()
    },
    [resetSessionTracking, setInternalInputMode, setWordIndex, stop],
  )

  // /**
  //  * Reset reading state when page content changes.
  //  */
  // useEffect(() => {
  //   if (internalInputMode !== 'page') return
  //   if (typeof pageContent !== 'string' || !pageContent.trim()) return

  //   // Reset reading position when page content is updated.
  //   stop()
  //   resetSessionTracking()
  // }, [pageContent, internalInputMode, resetSessionTracking, setWordIndex, stop])

  useEffect(() => {
    onReaderStateChange?.(readerState)
  }, [readerState, onReaderStateChange])

  /**
   * Update pasted content and switch to paste mode when initialPastedContent changes.
   * This handles new selection text while the reader is already open.
   */
  useEffect(() => {
    if (!initialPastedContent?.trim()) return

    _setPastedContent(initialPastedContent)
    setInternalInputMode('paste')
    setWordIndex(0)
    stop()
    resetSessionTracking()
  }, [initialPastedContent, resetSessionTracking, setWordIndex, stop])

  const handlePlay = () => {
    console.log('handlePlay', wordCountIndexed)
    if (wordCountIndexed === 0) return
    play()
    if (sessionStartRef.current == null) {
      sessionStartRef.current = Date.now()
    }
  }

  const handlePause = () => {
    pause()
    if (sessionStartRef.current) {
      sessionElapsedRef.current += (Date.now() - sessionStartRef.current) / 1000
      sessionStartRef.current = null
    }
    commitSessionStats(false)
  }

  const handleReset = () => {
    setWordIndex(0)
  }

  const handleStop = () => {
    stop()
    console.log('handleStop', readerState)

    if (sessionStartRef.current) {
      sessionElapsedRef.current += (Date.now() - sessionStartRef.current) / 1000
      sessionStartRef.current = null
    }

    commitSessionStats(true)
    resetSessionTracking()
  }

  const handleSeek = (index: number) => {
    setWordIndex(index)
  }

  const handlePanelChange = useCallback(
    (panel: PanelState) => {
      if (isPlaying) {
        handlePause()
      }
      setActivePanel(panel)
    },
    [handlePause, isPlaying],
  )

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
          if (isPlaying) {
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
          skipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          skipForward()
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
  }, [activePanel, isPlaying, settings, chunkWords.length, onSettingsChange])

  return (
    <Tabs
      value={activePanel}
      onValueChange={handlePanelChange}
      className={cn('@container/reader-main', classNames?.container)}
      ref={containerRef}
    >
      <div className={cn('flex min-h-0 flex-col')}>
        {/* Header */}
        <header className='flex items-center justify-between px-6 py-4 border-b sticky top-1 bg-popover z-10'>
          <h1 className='text-lg/tight @max-md/reader-main:text-sm font-semibold truncate max-w-1/2'>
            {pageContentTitle}
          </h1>
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
          {readerState === 'idle' ? (
            <ContentInput
              pastedContent={pastedContent}
              onPastedContentChange={handlePastedContentChange}
              onSelectPageContent={() => setInternalInputMode('page')}
              pageContentError={pageContentError}
              pageContent={pageContent ?? ''}
              activeMode={internalInputMode}
              onModeChange={handleInputModeChange}
              className={classNames?.contentInputContainer}
              onErrorResubmit={onErrorResubmit}
            />
          ) : (
            <WordDisplay
              chunkWords={chunkWords}
              settings={settings}
              isPlaying={isPlaying}
              onStop={handleStop}
            />
          )}
          {/* Control panel shows on both overlay and page layouts */}

          <ControlPanel
            isPlaying={isPlaying}
            skipBack={skipBack}
            skipForward={skipForward}
            onReset={handleReset}
            settings={settings}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSettingsChange={onSettingsChange}
            onSeek={handleSeek}
            containerRef={controlPanelRef}
            progressBar={
              settings.showProgress && (
                <ReadingProgressBar
                  currentIndex={wordIndex}
                  totalWords={totalWords}
                />
              )
            }
          />
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
