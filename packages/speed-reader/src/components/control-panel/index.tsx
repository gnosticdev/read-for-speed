'use client'

import { MobileControlPopover } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import type React from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { ReaderSettings, ReaderState } from '../rsvp-reader'
import { ChunkSizeControl } from './chunk-size-control'
import { PlaybackControls } from './playback-controls'
import { SpeedControl } from './speed-control'

interface ControlPanelProps {
  state: ReaderState
  settings: ReaderSettings
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
   * Current word index.
   */
  currentIndex: number
  /**
   * Total number of words in the reader.
   */
  totalWords: number
  /**
   * Callback to seek to a specific word index.
   */
  onSeek: (index: number) => void
  /**
   * Callback to reset the reader to the beginning.
   */
  onReset: () => void
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
  state,
  settings,
  onPlay,
  onPause,
  onStop,
  currentIndex,
  totalWords,
  onSeek,
  onReset,
  containerRef: container,
  onSettingsChange,
  progressBar,
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
      {progressBar}
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

  if (container?.current) {
    return createPortal(ControlPanelComponent, container.current)
  }

  return ControlPanelComponent
}
