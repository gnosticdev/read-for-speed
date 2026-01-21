import type { ReaderState } from '@read-for-speed/speed-reader/rsvp-reader'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type UseRSVPParams = {
  /**
   * Full text from Readability
   */
  content: string
  /** Number of words to show at once */
  chunkSize: number
  /** Number of words to skip forward or backward */
  skipWords: number
  /** Number of words to display per minute */
  wpm: number
  /** Autoplay on mount */
  autoplay?: boolean
  /** Number of words to buffer ahead of the current position (default 2000) */
  bufferWords?: number
  /** Time budget per batch in milliseconds (default 8) */
  parseBatchMs?: number
}

export type RSVPState = {
  /** Current chunk words */
  words: string[]
  /** Current start word index */
  wordIndex: number
  /** How many words have offsets indexed so far */
  wordCountIndexed: number
  /** Total number of words in the content (available once fully indexed) */
  totalWords: number
  /** Playback state */
  readerState: ReaderState
  /** Manually set current word index */
  setWordIndex: (i: number) => void
  /** Next word by `chunkSize` setting amount */
  next: () => void
  /** Previous word by `chunkSize` setting amount */
  prev: () => void
  /** Skip forward by `skipWords` setting amount */
  skipForward: () => void
  /** Skip back by `skipWords` setting amount */
  skipBack: () => void
  /** Play the reader at the current word index and speed */
  play: () => void
  /** Pause the reader */
  pause: () => void
  /** Toggle the reader playback state from playing to paused and vice versa */
  toggle: () => void
  /** Stop the reader */
  stop: () => void
}

/////////////////////////////////////////////
// WIP: may use this if chunking is too slow
/////////////////////////////////////////////

/**
 * **NOTE** you should use `useRSVP`
 * RSVP hook:
 * - Keeps `content` as one string
 * - Builds word start/end offsets incrementally during idle time
 * - Never materializes all "pages"/chunks as strings
 * - Slices only the active chunk words for display
 * - This is a low-level hook that is used to power the RSVPReader component
 * @internal
 */
export function useRSVPReader({
  content,
  chunkSize,
  skipWords,
  wpm,
  autoplay = false,
  bufferWords = 2000,
  parseBatchMs = 8,
}: UseRSVPParams): RSVPState {
  // Playback state
  const [readerState, setReaderState] = useState<ReaderState>(autoplay ? 'playing' : 'idle')
  const [wordIndex, _setWordIndex] = useState<number>(0)
  const [wordCountIndexed, setWordCountIndexed] = useState<number>(0)

  /**
   * Calculate total words upfront - this is lightweight (just counting matches)
   * and gives us the total immediately for progress display and bounds checking
   */
  const totalWords = useMemo(() => {
    const matches = content.match(/\S+/g)
    return matches ? matches.length : 0
  }, [content])

  // Incremental word indexing refs
  const textRef = useRef<string>(content)
  const reRef = useRef<RegExp | null>(null)
  const startsRef = useRef<number[]>([])
  const endsRef = useRef<number[]>([])
  const indexedCountRef = useRef<number>(0)
  const parsingRef = useRef<boolean>(false)
  const idleIdRef = useRef<number | null>(null)
  const timerIdRef = useRef<number | null>(null)

  // Reset when content changes
  useEffect(() => {
    textRef.current = content
    reRef.current = /\S+/g // words = non-whitespace runs
    startsRef.current = []
    endsRef.current = []
    indexedCountRef.current = 0
    parsingRef.current = false
    _setWordIndex(0)
    setWordCountIndexed(0)

    // kick indexing for initial viewport
    // (do not block; schedule via idle)
    scheduleEnsure(0 + Math.max(1, chunkSize) + bufferWords)
  }, [content])

  const clamp = (v: number, lo: number, hi: number) => {
    if (v < lo) return lo
    if (hi > 0 && v >= hi) return hi - 1
    return v
  }

  const setWordIndex = useCallback(
    (i: number) => {
      _setWordIndex(() => {
        const next = i | 0
        // Clamp to valid range: [0, totalWords - 1]
        // If totalWords is not yet known (0), allow any non-negative index
        return clamp(next, 0, totalWords)
      })
    },
    [totalWords],
  )

  // Ensure we have indexed offsets up to at least targetWordCount
  const ensureIndexedUpTo = useCallback(
    (targetWordCount: number) => {
      const target = Math.max(0, targetWordCount | 0)
      if (indexedCountRef.current >= target) return
      if (parsingRef.current) return

      parsingRef.current = true

      const runBatch = (deadline?: IdleDeadline) => {
        const text = textRef.current
        let re = reRef.current
        if (!re) re = reRef.current = /\S+/g

        const starts = startsRef.current
        const ends = endsRef.current

        const prevCount = indexedCountRef.current
        const startTime = performance.now()
        const timeBudgetMs = parseBatchMs

        while (indexedCountRef.current < target) {
          const m = re.exec(text)
          if (!m) break

          starts.push(m.index)
          ends.push(m.index + m[0].length)
          indexedCountRef.current++

          // Time slicing: prefer requestIdleCallback's timeRemaining when present
          if (deadline) {
            if (deadline.timeRemaining() < 1) break
          } else {
            if (performance.now() - startTime > timeBudgetMs) break
          }
        }

        if (indexedCountRef.current !== prevCount) {
          setWordCountIndexed(indexedCountRef.current)
        }

        // Done? Check if we've reached the end of the text or target
        const reachedEnd = re.lastIndex >= text.length
        if (indexedCountRef.current >= target || reachedEnd) {
          parsingRef.current = false
          return
        }

        // Continue later
        idleIdRef.current = requestIdleCallback(runBatch)
      }

      idleIdRef.current = requestIdleCallback(runBatch)
    },
    [parseBatchMs],
  )

  function scheduleEnsure(targetWordCount: number) {
    // Coalesce ensures; just call ensure (it will no-op if already ahead)
    ensureIndexedUpTo(targetWordCount)
  }

  // Maintain buffer ahead of current position
  useEffect(() => {
    // keep the index up to date with the current word index
    const needUpTo = wordIndex + Math.max(1, chunkSize) + bufferWords
    scheduleEnsure(needUpTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, chunkSize, bufferWords, ensureIndexedUpTo])

  // Build current words chunk from offsets (no global chunk strings)
  const words = useMemo(() => {
    const startWord = Math.max(0, wordIndex)
    const count = Math.max(1, chunkSize | 0)
    const endWordExclusive = startWord + count

    // If offsets not ready yet, return best-effort empty array
    if (wordCountIndexed <= startWord) return []

    const starts = startsRef.current
    const ends = endsRef.current
    const text = textRef.current

    const availableEnd = Math.min(endWordExclusive, wordCountIndexed)
    const out: string[] = []

    for (let i = startWord; i < availableEnd; i++) {
      out.push(text.slice(starts[i], ends[i]))
    }
    return out
  }, [wordIndex, chunkSize, wordCountIndexed])

  // Navigation - all respect totalWords bounds via setWordIndex clamping
  const next = useCallback(() => {
    setWordIndex(wordIndex + Math.max(1, chunkSize | 0))
  }, [wordIndex, chunkSize, setWordIndex])

  const prev = useCallback(() => {
    setWordIndex(wordIndex - Math.max(1, chunkSize | 0))
  }, [wordIndex, chunkSize, setWordIndex])

  const skipForward = useCallback(() => {
    setWordIndex(wordIndex + Math.max(1, skipWords | 0))
  }, [wordIndex, skipWords, setWordIndex])

  const skipBack = useCallback(() => {
    setWordIndex(wordIndex - Math.max(1, skipWords | 0))
  }, [wordIndex, skipWords, setWordIndex])

  // Playback timing: advance by chunkSize words per tick
  useEffect(() => {
    // clear any prior timer
    if (timerIdRef.current != null) {
      window.clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }

    // only advance if playing
    if (readerState !== 'playing') return

    const safeWpm = Math.min(1000, Math.max(50, wpm | 0))
    const perWordMs = 60000 / safeWpm
    const stepWords = Math.max(1, chunkSize | 0)
    const tickMs = perWordMs * stepWords

    timerIdRef.current = window.setInterval(() => {
      _setWordIndex((i) => {
        const next = i + stepWords
        // Stop playback if we've reached or exceeded the end
        if (totalWords > 0 && next >= totalWords) {
          setReaderState('paused')
          // Return the last valid position (totalWords - 1 or current if already at end)
          return Math.min(i, totalWords - 1)
        }
        return next
      })
    }, tickMs)

    return () => {
      if (timerIdRef.current != null) {
        window.clearInterval(timerIdRef.current)
        timerIdRef.current = null
      }
    }
  }, [readerState, wpm, chunkSize, totalWords])

  // Cleanup idle work on unmount
  useEffect(() => {
    return () => {
      if (idleIdRef.current != null) cancelIdleCallback(idleIdRef.current)
      if (timerIdRef.current != null) window.clearInterval(timerIdRef.current)
    }
  }, [])

  const play = useCallback(() => setReaderState('playing'), [])
  const pause = useCallback(() => setReaderState('paused'), [])
  const toggle = useCallback(
    () => setReaderState((p) => (p === 'playing' ? 'paused' : 'playing')),
    [],
  )
  /**
   * Stop playback and set reader to `idle` state.
   *
   * Always pauses first if currently playing to ensure cleanup.
   */
  const stop = useCallback(() => {
    if (readerState === 'playing') {
      pause()
    }
    setReaderState('idle')
  }, [readerState, pause, setReaderState])

  return {
    words,
    wordIndex,
    wordCountIndexed,
    totalWords,
    readerState,
    setWordIndex,
    next,
    prev,
    skipForward,
    skipBack,
    play,
    pause,
    toggle,
    stop,
  }
}
