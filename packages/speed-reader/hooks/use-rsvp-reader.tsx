import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type UseRsvpParams = {
  content: string // full text from Readability
  chunkSize: number // words shown at once
  skipWords: number // nav step for buttons
  wpm: number // 50..1000
  autoplay?: boolean
  bufferWords?: number // how far ahead to index (default 2000)
  parseBatchMs?: number // idle time budget per batch (default 8)
}

type RsvpState = {
  words: string[] // current chunk words
  wordIndex: number // current start word index
  wordCountIndexed: number // how many words have offsets indexed so far
  approxTotalWords?: number // optional (not computed here)
  isPlaying: boolean

  setWordIndex: (i: number) => void
  next: () => void
  prev: () => void
  skipForward: () => void
  skipBack: () => void

  play: () => void
  pause: () => void
  toggle: () => void
}

/////////////////////////////////////////////
// WIP: may use this if chunking is too slow
/////////////////////////////////////////////

/**
 * RSVP hook:
 * - Keeps `content` as one string
 * - Builds word start/end offsets incrementally during idle time
 * - Never materializes all "pages"/chunks as strings
 * - Slices only the active chunk words for display
 */
export function useRsvpReader({
  content,
  chunkSize,
  skipWords,
  wpm,
  autoplay = false,
  bufferWords = 2000,
  parseBatchMs = 8,
}: UseRsvpParams): RsvpState {
  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(autoplay)
  const [wordIndex, _setWordIndex] = useState<number>(0)

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
    textRef.current = content || ''
    reRef.current = /\S+/g // words = non-whitespace runs
    startsRef.current = []
    endsRef.current = []
    indexedCountRef.current = 0
    parsingRef.current = false

    _setWordIndex(0)
    setIsPlaying(autoplay)

    // kick indexing for initial viewport
    // (do not block; schedule via idle)
    scheduleEnsure(0 + Math.max(1, chunkSize) + bufferWords)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const clamp = (v: number, lo: number) => (v < lo ? lo : v)

  const setWordIndex = useCallback((i: number) => {
    _setWordIndex(() => {
      const next = i | 0
      return next < 0 ? 0 : next
    })
  }, [])

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

        // Done?
        if (indexedCountRef.current >= target || re.lastIndex >= text.length) {
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
    const needUpTo = wordIndex + Math.max(1, chunkSize) + bufferWords
    scheduleEnsure(needUpTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex, chunkSize, bufferWords, ensureIndexedUpTo])

  // Build current words chunk from offsets (no global chunk strings)
  const words = useMemo(() => {
    const startWord = clamp(wordIndex, 0)
    const count = Math.max(1, chunkSize | 0)
    const endWordExclusive = startWord + count

    // If offsets not ready yet, return best-effort empty array
    if (indexedCountRef.current <= startWord) return []

    const starts = startsRef.current
    const ends = endsRef.current
    const text = textRef.current

    const availableEnd = Math.min(endWordExclusive, indexedCountRef.current)
    const out: string[] = []

    for (let i = startWord; i < availableEnd; i++) {
      out.push(text.slice(starts[i], ends[i]))
    }
    return out
  }, [wordIndex, chunkSize])

  // Navigation
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

    if (!isPlaying) return

    const safeWpm = Math.min(1000, Math.max(50, wpm | 0))
    const perWordMs = 60000 / safeWpm
    const stepWords = Math.max(1, chunkSize | 0)
    const tickMs = perWordMs * stepWords

    timerIdRef.current = window.setInterval(() => {
      _setWordIndex((i) => i + stepWords)
    }, tickMs)

    return () => {
      if (timerIdRef.current != null) {
        window.clearInterval(timerIdRef.current)
        timerIdRef.current = null
      }
    }
  }, [isPlaying, wpm, chunkSize])

  // Cleanup idle work on unmount
  useEffect(() => {
    return () => {
      if (idleIdRef.current != null) cancelIdleCallback(idleIdRef.current)
      if (timerIdRef.current != null) window.clearInterval(timerIdRef.current)
    }
  }, [])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const toggle = useCallback(() => setIsPlaying((p) => !p), [])

  return {
    words,
    wordIndex,
    wordCountIndexed: indexedCountRef.current,
    isPlaying,
    setWordIndex,
    next,
    prev,
    skipForward,
    skipBack,
    play,
    pause,
    toggle,
  }
}
