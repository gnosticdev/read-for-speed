'use client'

import { Minus, Pause, Play, Plus, SkipBack, SkipForward, Square } from 'lucide-react'
import type React from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ReaderSettings, ReaderState } from './rsvp-reader'

interface ControlPanelProps
  extends React.PropsWithChildren<{
    state: ReaderState
    settings: ReaderSettings
    onPlay: () => void
    onPause: () => void
    onStop: () => void
    onSettingsChange: (settings: ReaderSettings) => void
    currentIndex: number
    totalWords: number
    onSeek: (index: number) => void
    container?: Element | null
  }> {}

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
  container,
  children,
}: ControlPanelProps) {
  /**
   * Adjust the reading speed by the given delta.
   */
  const adjustWpm = (delta: number) => {
    onSettingsChange({
      ...settings,
      wpm: Math.max(50, Math.min(1000, settings.wpm + delta)),
    })
  }

  /**
   * Skip backward by skipWords chunks.
   * Since each chunk already contains chunkSize words, we just move by skipWords indices.
   */
  const skipBack = () => {
    onSeek(Math.max(0, currentIndex - settings.skipWords))
  }

  /**
   * Skip forward by skipWords chunks.
   * Since each chunk already contains chunkSize words, we just move by skipWords indices.
   */
  const skipForward = () => {
    onSeek(Math.min(totalWords - 1, currentIndex + settings.skipWords))
  }

  const ControlPanelComponent = (
    <div
      className='px-6 py-4 border-t border-border w-full'
      data-control-panel
    >
      {children}
      <div className='flex items-center justify-between max-w-3xl mx-auto mt-4'>
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
          <span className='w-12 text-center font-mono'>{settings.wpm}</span>
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

        {/* Chunk size control - Value set here is kept in storage (no settings panel) */}
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>Words</span>
          <ToggleGroup
            value={[settings.chunkSize.toString()]}
            onValueChange={(value) =>
              onSettingsChange({ ...settings, chunkSize: Number(value[0] ?? 1) as 1 | 2 | 3 })
            }
          >
            {[1, 2, 3].map((size) => (
              <ToggleGroupItem
                key={size}
                aria-label={`${size} words`}
                value={size.toString()}
              >
                {size}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  )

  if (container) {
    return createPortal(ControlPanelComponent, container)
  }

  return ControlPanelComponent
}
