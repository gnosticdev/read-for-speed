"use client"

import { Play, Pause, Square, Minus, Plus, SkipBack, SkipForward } from "lucide-react"
import type { ReaderSettings, ReaderState } from "./rsvp-reader"

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
    <div
      className={`border-t border-border bg-card/50 backdrop-blur-sm ${className ?? ""}`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* WPM control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">WPM</span>
            <button
              type="button"
              onClick={() => adjustWpm(-25)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              aria-label="Decrease speed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-mono font-semibold">{settings.wpm}</span>
            <button
              type="button"
              onClick={() => adjustWpm(25)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              aria-label="Increase speed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={skipBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              aria-label="Skip back"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {state === "playing" ? (
              <button
                type="button"
                onClick={onPause}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Pause"
              >
                <Pause className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onPlay}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Play"
              >
                <Play className="w-6 h-6 ml-1" />
              </button>
            )}

            <button
              type="button"
              onClick={skipForward}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              aria-label="Skip forward"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onStop}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors ml-2"
              aria-label="Stop"
            >
              <Square className="w-5 h-5" />
            </button>
          </div>

          {/* Chunk size control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Words</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => onSettingsChange({ ...settings, chunkSize: size })}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium
                    transition-colors
                    ${settings.chunkSize === size ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}
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
