'use client'

import { Button } from '@read-for-speed/ui/components/button'
import { Kbd } from '@read-for-speed/ui/components/kbd'
import { cn } from '@read-for-speed/ui/lib/utils'
import { X } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { getMultiWordORPIndex } from '../lib/orp-index'

import type { ReaderSettings } from './rsvp-reader'

interface WordDisplayProps {
  /** Current chunk words to display */
  chunkWords: string[]
  settings: ReaderSettings
  isPlaying: boolean
  onStop?: () => void
}

/**
 * Displays a single word/chunk using the RSVP technique with ORP highlighting.
 * Font size is calculated dynamically based on container width to ensure
 * text always fits on a single line.
 */
export function WordDisplay({ chunkWords, settings, onStop }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { beforeORP, orpChar, afterORP } = useMemo(() => {
    if (chunkWords.length === 0) {
      return { beforeORP: '', orpChar: '', afterORP: '' }
    }

    const { anchorWordIndex, orpCharIndex } = getMultiWordORPIndex(chunkWords)
    const anchorWord = chunkWords[anchorWordIndex] ?? ''
    const cleanWord = anchorWord.trim()
    const idx = orpCharIndex
    const beforeWords = chunkWords.slice(0, anchorWordIndex).join(' ')
    const afterWords = chunkWords.slice(anchorWordIndex + 1).join(' ')

    const beforeText =
      beforeWords && cleanWord.slice(0, idx)
        ? `${beforeWords} ${cleanWord.slice(0, idx)}`
        : beforeWords || cleanWord.slice(0, idx)
    const afterText =
      cleanWord.slice(idx + 1) && afterWords
        ? `${cleanWord.slice(idx + 1)} ${afterWords}`
        : cleanWord.slice(idx + 1) || afterWords

    return {
      beforeORP: beforeText,
      orpChar: cleanWord[idx] || '',
      afterORP: afterText,
    }
  }, [chunkWords])

  const fontStyle = {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)',
  }[settings.fontFamily]

  const fontSizeMultiple = {
    sm: 0.75,
    md: 1.0,
    lg: 1.25,
  }[settings.fontSizePreset]

  return (
    <div className='flex-1 flex items-center justify-center px-6'>
      <div className='relative w-full max-w-4xl'>
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
          className={cn(
            'relative flex items-center justify-center mb-1.5 @container/word-display min-h-12',
          )}
          style={{ fontSize: `calc(max(4cqi, 16px) * ${fontSizeMultiple})`, fontFamily: fontStyle }}
          ref={containerRef}
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
