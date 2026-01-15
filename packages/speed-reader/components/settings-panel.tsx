'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ReaderSettings } from './rsvp-reader'

interface SettingsPanelProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  onClose: () => void
  layout?: 'overlay' | 'page'
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
  layout = 'overlay',
}: SettingsPanelProps) {
  const isOverlay = layout === 'overlay'

  return (
    <div
      className={
        isOverlay
          ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          : 'flex-1 flex items-center justify-center px-6 py-8'
      }
    >
      <div className='bg-card border border-border rounded-xl shadow-xl w-full max-w-md'>
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-lg font-semibold'>Settings</h2>
          <Button
            onClick={onClose}
            variant='ghost'
            size='icon-sm'
            aria-label='Close settings'
          >
            <X className='w-5 h-5' />
          </Button>
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
            <Slider
              id='font-size-input'
              min={24}
              max={96}
              step={4}
              value={settings.fontSize}
              onValueChange={(value) => onSettingsChange({ ...settings, fontSize: value })}
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
            <ToggleGroup
              id='font-family-input'
              value={[settings.fontFamily]}
              onValueChange={(value) => {
                const nextValue = value[0]
                if (!nextValue) return
                onSettingsChange({
                  ...settings,
                  fontFamily: nextValue as ReaderSettings['fontFamily'],
                })
              }}
              className='w-full gap-2'
              variant='outline'
            >
              {(
                [
                  { value: 'sans', label: 'Sans', className: 'font-sans' },
                  { value: 'mono', label: 'Mono', className: 'font-mono' },
                  { value: 'serif', label: 'Serif', className: 'font-serif' },
                ] as const
              ).map((font) => (
                <ToggleGroupItem
                  key={font.value}
                  value={font.value}
                  className={`${font.className} flex-1`}
                >
                  {font.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reading Speed */}
          <div className='space-y-2'>
            <label
              htmlFor='speed-input'
              className='text-sm font-medium'
            >
              Default Speed: {settings.wpm} WPM
            </label>
            <Slider
              id='speed-input'
              min={50}
              max={1000}
              step={25}
              value={settings.wpm}
              onValueChange={(value) => onSettingsChange({ ...settings, wpm: value })}
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>50 (Slow)</span>
              <span>1000 (Fast)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Show Progress Bar</span>
              <Switch
                checked={settings.showProgress}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showProgress: checked })
                }
                aria-label='Toggle progress bar'
              />
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Focus Animation</span>
              <Switch
                checked={settings.focusAnimation}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, focusAnimation: checked })
                }
                aria-label='Toggle focus animation'
              />
            </div>
          </div>
        </div>

        <div className='p-4 border-t border-border'>
          <Button
            onClick={onClose}
            className='w-full'
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
