'use client'

import { X } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReaderSettings } from './rsvp-reader'

interface WordDisplayProps {
  word: string
  settings: ReaderSettings
  isPlaying: boolean
  onStop?: () => void
}

// Calculate Optimal Recognition Point (ORP) - roughly 35% into the word
function getORPIndex(word: string): number {
  const trimmedWord = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') // trim punctuation
  const length = [...trimmedWord].length // Unicode-safe length
  if (length <= 1) return 0
  if (length <= 3) return 0
  if (length <= 5) return 1
  if (length <= 9) return 2
  if (length <= 13) return 3
  return Math.floor(length * 0.35)
}

export function WordDisplay({ word, settings, onStop }: WordDisplayProps) {
  const { beforeORP, orpChar, afterORP } = useMemo(() => {
    const cleanWord = word.trim()
    const idx = getORPIndex(cleanWord)
    return {
      orpIndex: idx,
      beforeORP: cleanWord.slice(0, idx),
      orpChar: cleanWord[idx] || '',
      afterORP: cleanWord.slice(idx + 1),
    }
  }, [word])

  const fontClass = {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)',
  }[settings.fontFamily]

  return (
    <div className='flex-1 flex items-center justify-center px-6'>
      <div className='relative w-full max-w-4xl'>
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
          style={{ fontSize: `${settings.fontSize}px`, fontFamily: fontClass }}
        >
          {/* Before ORP - align right */}
          <span className='text-foreground/70 text-right min-w-[40%] flex justify-end leading-relaxed tracking-wide'>
            {beforeORP}
          </span>

          {/* ORP character - highlighted */}
          <span className={cn('text-red-500 font-semibold relative leading-relaxed tracking-wide')}>
            {orpChar}
            {/* Subtle underline indicator */}
            <span className='absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500/80 rounded-full' />
          </span>

          {/* After ORP - align left */}
          <span className='text-foreground/70 text-left min-w-[40%] leading-relaxed tracking-wide'>
            {afterORP}
          </span>
        </div>

        {/* Keyboard hints */}
        <div className='absolute -bottom-16 inset-x-0 flex justify-center gap-6 text-xs text-muted-foreground'>
          <span>
            <kbd className='px-1.5 py-0.5 bg-secondary rounded text-[10px]'>Space</kbd> Play/Pause
          </span>
          <span>
            <kbd className='px-1.5 py-0.5 bg-secondary rounded text-[10px]'>↑↓</kbd> Speed
          </span>
          <span>
            <kbd className='px-1.5 py-0.5 bg-secondary rounded text-[10px]'>←→</kbd> Skip
          </span>
          <span>
            <kbd className='px-1.5 py-0.5 bg-secondary rounded text-[10px]'>Esc</kbd> Stop
          </span>
        </div>
      </div>
    </div>
  )
}
