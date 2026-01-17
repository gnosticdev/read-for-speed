'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ReaderSettings } from './rsvp-reader'

interface SettingsPanelProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  onSave: () => void
  layout?: 'overlay' | 'page'
}

const MIN_FONT_SIZE = 24
const MAX_FONT_SIZE = 96
const MIN_WPM = 50
const MAX_WPM = 1000
const STEP_FONT_SIZE = 4
const STEP_WPM = 25

export function SettingsPanel({
  settings,
  onSettingsChange,
  onSave,
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
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Font Size */}
          <div className='space-y-3'>
            <Label
              htmlFor='font-size-input'
              className='text-sm font-medium'
            >
              Font Size: {settings.fontSize}px
            </Label>
            <Slider
              id='font-size-input'
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={STEP_FONT_SIZE}
              value={settings.fontSize}
              onValueChange={(value) => onSettingsChange({ ...settings, fontSize: value })}
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{MIN_FONT_SIZE}px</span>
              <span>{MAX_FONT_SIZE}px</span>
            </div>
          </div>

          {/* Font Family */}
          <div className='space-y-3'>
            <Label htmlFor='font-family-input'>Font Family</Label>
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
              className='w-full'
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
                  aria-label={font.label}
                >
                  {font.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reading Speed */}
          <div className='space-y-3'>
            <Label htmlFor='speed-input'>Default Speed: {settings.wpm} WPM</Label>
            <Slider
              id='speed-input'
              min={MIN_WPM}
              max={MAX_WPM}
              step={STEP_WPM}
              value={settings.wpm}
              onValueChange={(value) => onSettingsChange({ ...settings, wpm: value })}
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{MIN_WPM} (Slow)</span>
              <span>{MAX_WPM} (Fast)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className='space-y-3'>
            <Label
              className='flex items-center gap-6 rounded-lg border p-3 hover:bg-accent/50 justify-between'
              htmlFor='use-page-action-input'
              aria-label='Toggle toolbar button to open'
            >
              <div className='flex flex-col gap-1'>
                <p>Open from Extension Toolbar</p>
                <p className='text-muted-foreground text-xs'>
                  Use the Extension toolbar to launch the speed reader, instead of showing the
                  floating button
                </p>
              </div>
              <Switch
                id='use-page-action-input'
                checked={settings.usePageAction}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, usePageAction: checked })
                }
              />
            </Label>

            <Label
              className='flex items-center gap-6 rounded-lg border p-3 hover:bg-accent/50 justify-between'
              htmlFor='show-progress-input'
              aria-label='Toggle progress bar'
            >
              <div className='flex flex-col gap-1'>
                <p>Show Progress Bar</p>
                <p className='text-muted-foreground text-xs'>
                  Show a progress bar at the bottom of the page.
                </p>
              </div>
              <Switch
                id='show-progress-input'
                checked={settings.showProgress}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showProgress: checked })
                }
              />
            </Label>

            <Label
              className='flex items-center gap-6 rounded-lg border p-3 hover:bg-accent/50 justify-between'
              htmlFor='focus-animation-input'
              aria-label='Toggle focus animation'
            >
              <div className='flex flex-col gap-1'>
                <p>Focus Animation</p>
                <p className='text-muted-foreground text-xs'>Animate the focus of the reader.</p>
              </div>
              <Switch
                id='focus-animation-input'
                checked={settings.focusAnimation}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, focusAnimation: checked })
                }
              />
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onSave}
            className='w-full'
          >
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
