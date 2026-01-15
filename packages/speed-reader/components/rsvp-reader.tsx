'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { extractContent } from '../lib/content-extractor'
import { ContentInput } from './content-input'
import { ControlPanel } from './control-panel'
import { SettingsPanel } from './settings-panel'
import { StatsPanel } from './stats-panel'
import { WordDisplay } from './word-display'
import { BookOpen } from 'lucide-react'

export type ReaderState = 'idle' | 'playing' | 'paused'

export interface ReaderSettings {
  wpm: number
  chunkSize: number
  fontSize: number
  fontFamily: 'sans' | 'mono' | 'serif'
  showProgress: boolean
  focusAnimation: boolean
}

export interface ReadingStats {
  wordsRead: number
  totalWords: number
  sessionsCompleted: number
  averageWpm: number
  totalTimeSeconds: number
}

export interface RSVPReaderProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  onUsePageContent?: () => void
  pageContentStatus?: 'idle' | 'loading' | 'error' | 'ready'
  pageContentTitle?: string | null
  pageContentError?: string | null
  containerClassName?: string
  controlsContainer?: HTMLElement | null
  controlPanelClassName?: string
}

const DEFAULT_SETTINGS: ReaderSettings = {
  wpm: 300,
  chunkSize: 1,
  fontSize: 48,
  fontFamily: 'sans',
  showProgress: true,
  focusAnimation: true,
}

const SAMPLE_TEXT = `Speed reading is a collection of methods that attempt to increase rates of reading without significantly reducing comprehension or retention. Methods include chunking and minimizing subvocalization. The many speed reading training programs available include books, videos, software, and seminars.

The scientific consensus is that reading faster results in reading less accurately and that the average college-level reader reads at about 200 to 400 words per minute. The concept of speed reading challenges some of these assumptions by proposing techniques that suppress subvocalization and use peripheral vision more efficiently.

RSVP, or Rapid Serial Visual Presentation, is a technique that displays text one word at a time in a fixed focal position. This eliminates the need for eye movement and can significantly increase reading speed while maintaining comprehension when properly implemented.`

export function RSVPReader({
  initialContent,
  onContentChange,
  onUsePageContent,
  pageContentStatus,
  pageContentTitle,
  pageContentError,
  containerClassName,
  controlsContainer,
  controlPanelClassName,
}: RSVPReaderProps) {
  const [content, setContent] = useState(() => initialContent ?? SAMPLE_TEXT)
  const [words, setWords] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [state, setState] = useState<ReaderState>('idle')
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
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

  const handleContentChange = useCallback(
    (nextContent: string) => {
      setContent(nextContent)
      onContentChange?.(nextContent)
    },
    [onContentChange],
  )

  useEffect(() => {
    if (typeof initialContent !== 'string') return
    if (!initialContent.trim() || initialContent === content) return

    // Reset reading state when external content is loaded.
    setContent(initialContent)
    setCurrentIndex(0)
    setState('idle')
    wordsReadInSessionRef.current = 0
    sessionStartRef.current = null
  }, [initialContent, content])

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
          if (prev >= words.length - settings.chunkSize) {
            // Session complete
            setState('idle')
            const sessionTime = (Date.now() - (sessionStartRef.current || Date.now())) / 1000
            setStats((s) => ({
              ...s,
              wordsRead: s.wordsRead + wordsReadInSessionRef.current + settings.chunkSize,
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
          wordsReadInSessionRef.current += settings.chunkSize
          return prev + settings.chunkSize
        })
      }, getInterval())
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, words.length, settings.chunkSize, getInterval])

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: ok
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
          setSettings((s) => ({ ...s, wpm: Math.min(1000, s.wpm + 25) }))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSettings((s) => ({ ...s, wpm: Math.max(50, s.wpm - 25) }))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentIndex((i) => Math.max(0, i - settings.chunkSize * 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentIndex((i) => Math.min(words.length - 1, i + settings.chunkSize * 5))
          break
        case 'Escape':
          if (state === 'playing') {
            e.preventDefault() // prevent dialog from closing
            handlePause()
          } else {
            handleStop()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [state, settings.chunkSize, words.length])

  const currentChunk = words.slice(currentIndex, currentIndex + settings.chunkSize).join(' ')
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0

  const controlPanel = (
    <ControlPanel
      state={state}
      settings={settings}
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onSettingsChange={setSettings}
      currentIndex={currentIndex}
      totalWords={words.length}
      onSeek={handleSeek}
      className={controlPanelClassName}
    />
  )

  return (
    <div
      className={`flex flex-col ${containerClassName ?? 'h-screen'} bg-background text-foreground`}
    >
      {/* Header */}
      <header className='flex items-center justify-between px-6 py-4 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center'>
            <BookOpen className='w-4 h-4 text-primary-foreground' />
          </div>
          <h1 className='text-lg/tight   font-semibold'>The Read For Speed</h1>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowStats(!showStats)}
            className='px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors'
          >
            Stats
          </button>
          <button
            type='button'
            onClick={() => setShowSettings(!showSettings)}
            className='px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors'
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className='flex-1 flex flex-col'>
        {state === 'idle' && currentIndex === 0 ? (
          <ContentInput
            content={content}
            onContentChange={handleContentChange}
            onUsePageContent={onUsePageContent}
            pageContentStatus={pageContentStatus}
            pageContentTitle={pageContentTitle}
            pageContentError={pageContentError}
          />
        ) : (
          <WordDisplay
            word={currentChunk}
            settings={settings}
            isPlaying={state === 'playing'}
          />
        )}

        {/* Progress bar */}
        {settings.showProgress && words.length > 0 && (
          <div className='px-6 pb-4'>
            <div className='relative h-1 bg-secondary rounded-full overflow-hidden'>
              <div
                className='absolute inset-y-0 left-0 bg-primary transition-all duration-100'
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className='flex justify-between mt-2 text-xs text-muted-foreground'>
              <span>
                {currentIndex + 1} / {words.length} words
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Control panel */}
      {controlsContainer
        ? // Portal controls into dialog footer when provided.
          createPortal(controlPanel, controlsContainer)
        : controlPanel}

      {/* Settings panel overlay */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Stats panel overlay */}
      {showStats && (
        <StatsPanel
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}
