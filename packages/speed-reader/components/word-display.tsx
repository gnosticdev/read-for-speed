'use client'

import { useMemo } from 'react'
import type { ReaderSettings } from './rsvp-reader'

interface WordDisplayProps {
  word: string
  settings: ReaderSettings
  isPlaying: boolean
}

// Calculate Optimal Recognition Point (ORP) - roughly 35% into the word
function getORPIndex(word: string): number {
  const length = word.length
  if (length <= 1) return 0
  if (length <= 3) return 0
  if (length <= 5) return 1
  if (length <= 9) return 2
  if (length <= 13) return 3
  return Math.floor(length * 0.35)
}

export function WordDisplay({ word, settings, isPlaying }: WordDisplayProps) {
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
    sans: 'font-sans',
    mono: 'font-mono',
    serif: 'font-serif',
  }[settings.fontFamily]

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
          className={`
            relative flex items-center justify-center
            ${fontClass}
            ${settings.focusAnimation && isPlaying ? 'animate-pulse-subtle' : ''}
          `}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {/* Before ORP - align right */}
          <span className='text-foreground/70 text-right min-w-[40%] flex justify-end'>
            {beforeORP}
          </span>

          {/* ORP character - highlighted */}
          <span
            className={`
              text-red-500 font-bold relative
              ${settings.focusAnimation && isPlaying ? 'scale-110' : ''}
              transition-transform duration-75
            `}
          >
            {orpChar}
            {/* Subtle underline indicator */}
            <span className='absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500/50 rounded-full' />
          </span>

          {/* After ORP - align left */}
          <span className='text-foreground/70 text-left min-w-[40%]'>{afterORP}</span>
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
