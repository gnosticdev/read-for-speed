'use client'

import { X } from 'lucide-react'
import type { ReaderSettings } from './rsvp-reader'

interface SettingsPanelProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  return (
    <div className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-card border border-border rounded-xl shadow-xl w-full max-w-md'>
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-lg font-semibold'>Settings</h2>
          <button
            type='button'
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-4 space-y-6'>
          {/* Font Size */}
          <div className='space-y-2'>
            <label
              htmlFor='font-size-input'
              className='text-sm font-medium'
            >
              Font Size: {settings.fontSize}px
            </label>
            <input
              id='font-size-input'
              type='range'
              min='24'
              max='96'
              step='4'
              value={settings.fontSize}
              onChange={(e) =>
                onSettingsChange({ ...settings, fontSize: Number.parseInt(e.target.value) })
              }
              className='w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary'
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>24px</span>
              <span>96px</span>
            </div>
          </div>

          {/* Font Family */}
          <div className='space-y-2'>
            <label
              htmlFor='font-family-input'
              className='text-sm font-medium'
            >
              Font Family
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {(
                [
                  { value: 'sans', label: 'Sans' },
                  { value: 'mono', label: 'Mono' },
                  { value: 'serif', label: 'Serif' },
                ] as const
              ).map((font) => (
                <button
                  type='button'
                  key={font.value}
                  onClick={() => onSettingsChange({ ...settings, fontFamily: font.value })}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${font.value === 'sans' ? 'font-sans' : font.value === 'mono' ? 'font-mono' : 'font-serif'}
                    ${
                      settings.fontFamily === font.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }
                  `}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Speed */}
          <div className='space-y-2'>
            <label
              htmlFor='speed-input'
              className='text-sm font-medium'
            >
              Default Speed: {settings.wpm} WPM
            </label>
            <input
              id='speed-input'
              type='range'
              min='50'
              max='1000'
              step='25'
              value={settings.wpm}
              onChange={(e) =>
                onSettingsChange({ ...settings, wpm: Number.parseInt(e.target.value) })
              }
              className='w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary'
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>50 (Slow)</span>
              <span>1000 (Fast)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className='space-y-3'>
            <label className='flex items-center justify-between cursor-pointer'>
              <span className='text-sm font-medium'>Show Progress Bar</span>
              <button
                type='button'
                onClick={() =>
                  onSettingsChange({ ...settings, showProgress: !settings.showProgress })
                }
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${settings.showProgress ? 'bg-primary' : 'bg-secondary'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${settings.showProgress ? 'left-5.5' : 'left-0.5'}
                  `}
                  style={{ left: settings.showProgress ? '22px' : '2px' }}
                />
              </button>
            </label>

            <label className='flex items-center justify-between cursor-pointer'>
              <span className='text-sm font-medium'>Focus Animation</span>
              <button
                type='button'
                onClick={() =>
                  onSettingsChange({ ...settings, focusAnimation: !settings.focusAnimation })
                }
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${settings.focusAnimation ? 'bg-primary' : 'bg-secondary'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  `}
                  style={{ left: settings.focusAnimation ? '22px' : '2px' }}
                />
              </button>
            </label>
          </div>
        </div>

        <div className='p-4 border-t border-border'>
          <button
            type='button'
            onClick={onClose}
            className='w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors'
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
