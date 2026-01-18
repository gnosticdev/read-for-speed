'use client'

import { MobileControlPopover } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import { PopoverCreateHandle } from '@read-for-speed/speed-reader/ui/anchored-popover'
import type React from 'react'
import { createPortal } from 'react-dom'
import type { ReaderSettings, ReaderState } from '../rsvp-reader'
import { ChunkSizeControl } from './chunk-size-control'
import { PlaybackControls } from './playback-controls'
import { SpeedControl } from './speed-control'

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
  onReset: () => void
  container?: HTMLElement | null
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
  onReset,
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
      className='border-t border-border w-full @container/control-panel space-y-4 py-4'
      data-control-panel
    >
      {children}
      <div className='flex items-center justify-between'>
        {/* WPM control */}
        <SpeedControl
          settings={settings}
          onSettingsChange={onSettingsChange}
          container={container}
        />

        {/* Playback controls */}
        <PlaybackControls
          state={state}
          onPause={onPause}
          onPlay={onPlay}
          skipBack={skipBack}
          skipForward={skipForward}
          onStop={onStop}
          onReset={onReset}
        />

        {/* Chunk size control - Value set here is kept in storage (no settings panel) */}
        <ChunkSizeControl
          settings={settings}
          onSettingsChange={onSettingsChange}
          container={container}
        />
        <MobileControlPopover
          container={container}
          onSettingsChange={onSettingsChange}
          settings={settings}
        />
      </div>
    </div>
  )

  if (container) {
    return createPortal(ControlPanelComponent, container)
  }

  return ControlPanelComponent
}
