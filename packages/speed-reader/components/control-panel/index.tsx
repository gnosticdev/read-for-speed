'use client'

import type React from 'react'
import { createPortal } from 'react-dom'
import { ChunkSizeControl } from '@/packages/speed-reader/components/control-panel/chunk-size-control'
import { PlaybackControls } from '@/packages/speed-reader/components/control-panel/playback-controls'
import { SpeedControl } from '@/packages/speed-reader/components/control-panel/speed-control'
import type { ReaderSettings, ReaderState } from '../rsvp-reader'

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
  container?: Element | null
  children?: React.ReactNode
}

export function ControlPanel({
  state,
  settings,
  onPlay,
  onPause,
  onStop,
  currentIndex,
  totalWords,
  onSeek,
  container,
  onSettingsChange,
  children,
}: ControlPanelProps) {
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
      className='border-t border-border w-full @container/control-panel'
      data-control-panel
    >
      {children}
      <div className='flex items-center justify-between mt-4 @max-md/control-panel:flex-wrap @max-md/control-panel:gap-3'>
        {/* WPM control */}
        <SpeedControl
          settings={settings}
          onSettingsChange={onSettingsChange}
        />

        {/* Playback controls */}
        <PlaybackControls
          state={state}
          onPause={onPause}
          onPlay={onPlay}
          skipBack={skipBack}
          skipForward={skipForward}
          onStop={onStop}
        />

        {/* Chunk size control - Value set here is kept in storage (no settings panel) */}
        <ChunkSizeControl
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>
    </div>
  )

  if (container) {
    return createPortal(ControlPanelComponent, container)
  }

  return ControlPanelComponent
}
