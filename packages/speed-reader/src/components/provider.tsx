import type React from 'react'
import { createContext, useContext, useMemo } from 'react'
import { type RSVPState, useRSVPReader } from '../internal/use-rsvp-reader'

type Values = Pick<
  RSVPState,
  'words' | 'wordIndex' | 'wordCountIndexed' | 'totalWords' | 'readerState'
>
type Controls = Pick<
  RSVPState,
  | 'setWordIndex'
  | 'next'
  | 'prev'
  | 'skipForward'
  | 'skipBack'
  | 'play'
  | 'pause'
  | 'toggle'
  | 'stop'
>

const RSVPValuesCtx = createContext<Values | null>(null)
const RSVPControlsCtx = createContext<Controls | null>(null)

export function RSVPProvider({
  content,
  autoplay,
  chunkSize,
  skipWords,
  wpm,
  children,
}: {
  content: string
  autoplay?: boolean
  children: React.ReactNode
  chunkSize: number
  skipWords: number
  wpm: number
}) {
  const readerState = useRSVPReader({
    content,
    chunkSize,
    skipWords,
    wpm,
    autoplay,
  })

  const view = useMemo<Values>(
    () => ({
      words: readerState.words,
      wordIndex: readerState.wordIndex,
      wordCountIndexed: readerState.wordCountIndexed,
      totalWords: readerState.totalWords,
      readerState: readerState.readerState,
    }),
    [
      readerState.words,
      readerState.wordIndex,
      readerState.wordCountIndexed,
      readerState.totalWords,
      readerState.readerState,
    ],
  )

  const controls = useMemo<Controls>(
    () => ({
      setWordIndex: readerState.setWordIndex,
      next: readerState.next,
      prev: readerState.prev,
      skipForward: readerState.skipForward,
      skipBack: readerState.skipBack,
      play: readerState.play,
      pause: readerState.pause,
      toggle: readerState.toggle,
      stop: readerState.stop,
    }),
    [
      readerState.setWordIndex,
      readerState.next,
      readerState.prev,
      readerState.skipForward,
      readerState.skipBack,
      readerState.play,
      readerState.pause,
      readerState.toggle,
      readerState.stop,
    ],
  )

  return (
    <RSVPValuesCtx.Provider value={view}>
      <RSVPControlsCtx.Provider value={controls}>{children}</RSVPControlsCtx.Provider>
    </RSVPValuesCtx.Provider>
  )
}

export function useRSVPValues() {
  const ctx = useContext(RSVPValuesCtx)
  if (!ctx) throw new Error('useRSVPValues must be used within RSVPProvider')
  return ctx
}

export function useRSVPControls() {
  const ctx = useContext(RSVPControlsCtx)
  if (!ctx) throw new Error('useRSVPControls must be used within RSVPProvider')
  return ctx
}
