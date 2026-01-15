'use client'

import { Minus, Pause, Play, Plus, SkipBack, SkipForward, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReaderSettings, ReaderState } from './rsvp-reader'

interface ControlPanelProps {
  state: ReaderState
  settings: ReaderSettings
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSettingsChange: (settings: ReaderSettings) => void
  currentIndex: number
  totalWords: number
  onSeek: (index: number) => void
  className?: string
}

export function ControlPanel({
  state,
  settings,
  onPlay,
  onPause,
  onStop,
  onSettingsChange,
  currentIndex,
  totalWords,
  onSeek,
  className,
}: ControlPanelProps) {
  const adjustWpm = (delta: number) => {
    onSettingsChange({
      ...settings,
      wpm: Math.max(50, Math.min(1000, settings.wpm + delta)),
    })
  }

  const skipBack = () => {
    onSeek(Math.max(0, currentIndex - settings.chunkSize * 10))
  }

  const skipForward = () => {
    onSeek(Math.min(totalWords - 1, currentIndex + settings.chunkSize * 10))
  }

  return (
    <div className={`border-t border-border bg-card/50 backdrop-blur-sm ${className ?? ''}`}>
      <div className='px-6 py-4'>
        <div className='flex items-center justify-between max-w-3xl mx-auto'>
          {/* WPM control */}
          <div className='flex items-center gap-3'>
            <span className='text-sm text-muted-foreground w-12'>WPM</span>
            <Button
              size='icon'
              variant='secondary'
              onClick={() => adjustWpm(-25)}
              aria-label='Decrease speed'
            >
              <Minus />
            </Button>
            <span className='w-12 text-center font-mono font-semibold'>{settings.wpm}</span>
            <Button
              size='icon'
              variant={'secondary'}
              onClick={() => adjustWpm(25)}
              aria-label='Increase speed'
            >
              <Plus />
            </Button>
          </div>

          {/* Playback controls */}
          <div className='flex items-center gap-2'>
            <Button
              size='icon'
              variant='outline'
              onClick={skipBack}
              aria-label='Skip back'
            >
              <SkipBack />
            </Button>

            {/* Play/Pause button */}
            {state === 'playing' ? (
              <Button
                size='icon-xl'
                variant='default'
                onClick={onPause}
                aria-label='Pause'
                className='rounded-full'
              >
                <Pause />
              </Button>
            ) : (
              <Button
                size='icon-xl'
                variant='default'
                onClick={onPlay}
                aria-label='Play'
                className='rounded-full'
              >
                <Play />
              </Button>
            )}

            <Button
              size='icon'
              variant='outline'
              onClick={skipForward}
              aria-label='Stop'
            >
              <SkipForward />
            </Button>

            <Button
              size='icon'
              variant={state === 'playing' ? 'destructive-outline' : 'outline'}
              onClick={onStop}
              aria-label='Stop'
            >
              <Square />
            </Button>
          </div>

          {/* Chunk size control */}
          <div className='flex items-center gap-3'>
            <span className='text-sm text-muted-foreground'>Words</span>
            <div className='flex gap-1'>
              {[1, 2, 3].map((size) => (
                <button
                  type='button'
                  key={size}
                  onClick={() => onSettingsChange({ ...settings, chunkSize: size })}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium
                    transition-colors
                    ${settings.chunkSize === size ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
