'use client'

import { Button } from '@read-for-speed/ui/components/button'
import { Kbd } from '@read-for-speed/ui/components/kbd'
import { cn } from '@read-for-speed/ui/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateFontSize, findLargestChunkLength } from '../lib/content-utils'
import { getSingleWordORPIndex } from '../lib/orp-index'

import type { ReaderSettings } from './rsvp-reader'

interface WordDisplayProps {
  currentChunk: string
  /** All chunks - used to calculate the largest chunk for font sizing */
  chunks: string[]
  settings: ReaderSettings
  isPlaying: boolean
  onStop?: () => void
}

/**
 * Displays a single word/chunk using the RSVP technique with ORP highlighting.
 * Font size is calculated dynamically based on container width to ensure
 * text always fits on a single line.
 */
export function WordDisplay({ currentChunk, chunks, settings, onStop }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  /**
   * Measure container width and update on resize.
   * Uses ResizeObserver for efficient resize detection.
   */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      setContainerWidth(container.clientWidth)
    }

    // Initial measurement
    updateWidth()

    // Observe resize events
    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  /**
   * Calculate the largest chunk length from all chunks.
   * Only recalculates when chunks change (i.e., when content or chunkSize changes).
   */
  const largestChunkLength = useMemo(() => {
    return findLargestChunkLength(chunks)
  }, [chunks])

  const { beforeORP, orpChar, afterORP } = useMemo(() => {
    const cleanWord = currentChunk.trim()
    const idx = getSingleWordORPIndex(cleanWord)
    return {
      orpIndex: idx,
      beforeORP: cleanWord.slice(0, idx),
      orpChar: cleanWord[idx] || '',
      afterORP: cleanWord.slice(idx + 1),
    }
  }, [currentChunk])

  const fontStyle = {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)',
  }[settings.fontFamily]

  /**
   * Calculate the optimal font size based on container width, preset,
   * and the largest chunk length in the content.
   * Recalculates when container width, font settings, or chunks change.
   */
  const fontSize = useMemo(() => {
    return calculateFontSize({
      containerWidth,
      preset: settings.fontSizePreset,
      fontFamily: settings.fontFamily,
      largestChunkLength,
    })
  }, [containerWidth, settings.fontSizePreset, settings.fontFamily, largestChunkLength])

  return (
    <div className='flex-1 flex items-center justify-center px-6'>
      <div
        ref={containerRef}
        className='relative w-full max-w-4xl'
      >
        {/* Quick exit button so users can return to the main screen. */}
        {onStop && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            onClick={onStop}
            className='absolute right-0 top-0 z-50'
            aria-label='Stop reading'
          >
            <X />
          </Button>
        )}
        {/* Focal guide lines */}
        <div className='absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none'>
          <div className='absolute w-px h-16 bg-primary/20 -top-8' />
          <div
            className='absolute w-px h-16 bg-primary/20 -bottom-8 top-auto'
            style={{ top: '32px' }}
          />
        </div>

        {/* Word container */}
        <div
          className={cn('relative flex items-center justify-center mb-1.5')}
          style={{ fontSize: `${fontSize}px`, fontFamily: fontStyle }}
        >
          {/* Before ORP - align right */}
          <span className='text-foreground/70 text-right min-w-[40%] flex justify-end leading-relaxed tracking-wide'>
            {beforeORP}
          </span>

          {/* ORP character - highlighted */}
          <span className={cn('text-red-500 font-semibold relative leading-relaxed tracking-wide')}>
            {orpChar}
            {/* Subtle underline indicator */}
            <span className='absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500/50 rounded-full' />
          </span>

          {/* After ORP - align left */}
          <span className='text-foreground/70 text-left min-w-[40%] leading-relaxed tracking-wide'>
            {afterORP}
          </span>
        </div>

        {/* Keyboard hints */}
        <div className='absolute -bottom-16 inset-x-0 flex justify-between gap-6 text-xs text-muted-foreground'>
          <div className='flex @max-md/reader-main:flex-col items-center gap-1'>
            <Kbd>Space</Kbd> Play/Pause
          </div>
          <div className='flex @max-md/reader-main:flex-col items-center gap-1'>
            <Kbd>↑↓</Kbd> Speed
          </div>
          <div className='flex @max-md/reader-main:flex-col items-center gap-1'>
            <Kbd>←→</Kbd> Skip
          </div>
          <div className='flex @max-md/reader-main:flex-col items-center gap-1'>
            <Kbd>Esc</Kbd> Stop
          </div>
        </div>
      </div>
    </div>
  )
}
