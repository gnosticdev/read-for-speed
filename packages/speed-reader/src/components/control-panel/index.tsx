'use client'

import { MobileControlPopover } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import { useRSVPControls } from '@read-for-speed/speed-reader/provider'
import type React from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { ReaderSettings, ReaderState } from '../rsvp-reader'
import { ChunkSizeControl } from './chunk-size-control'
import { PlaybackControls } from './playback-controls'
import { SpeedControl } from './speed-control'

interface ControlPanelProps {
  settings: ReaderSettings
  isPlaying: boolean
  onPlay: () => void
  /**
   * Callback to pause the reader.
   */
  onPause: () => void
  /**
   * Callback to stop the reader.
   */
  onStop: () => void
  /**
   * Callback to change the reader settings.
   */
  onSettingsChange: (settings: ReaderSettings) => void
  /**
   * Callback to seek to a specific word index.
   */
  onSeek: (index: number) => void
  /**
   * Callback to reset the reader to the beginning.
   */
  onReset: () => void
  /**
   * Callback to skip backward.
   */
  skipBack: () => void
  /**
   * Callback to skip forward.
   */
  skipForward: () => void
  /**
   * Ref to the container element for the control panel.
   * Control panel will be rendered at the bottom of the `reader` tab if no ref is provided.
   */
  containerRef?: RefObject<HTMLDivElement | null>
  /**
   * Optional progress bar component to display at the top of the control panel.
   */
  progressBar?: React.ReactNode | null
}

export function ControlPanel({
  isPlaying,
  settings,
  onPlay,
  onPause,
  onStop,
  onReset,
  containerRef,
  onSettingsChange,
  progressBar,
  skipBack,
  skipForward,
}: ControlPanelProps) {
  const ControlPanelComponent = (
    <div
      className='border-t border-border w-full @container/control-panel space-y-4 py-4'
      data-control-panel
    >
      {progressBar}
      <div className='flex items-center justify-between'>
        {/* WPM control */}
        <SpeedControl
          settings={settings}
          onSettingsChange={onSettingsChange}
          container={containerRef}
        />

        {/* Playback controls */}
        <PlaybackControls
          isPlaying={isPlaying}
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
        />
        <MobileControlPopover
          container={containerRef}
          onSettingsChange={onSettingsChange}
          settings={settings}
        />
      </div>
    </div>
  )

  if (containerRef?.current) {
    return createPortal(ControlPanelComponent, containerRef.current)
  }

  return ControlPanelComponent
}
