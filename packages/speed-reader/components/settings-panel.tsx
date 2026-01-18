'use client'

import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from '@read-for-speed/speed-reader/ui/anchored-popover'
import { Button } from '@read-for-speed/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@read-for-speed/ui/components/card'
import { Label } from '@read-for-speed/ui/components/label'
import { Separator } from '@read-for-speed/ui/components/separator'
import { Slider } from '@read-for-speed/ui/components/slider'
import { Switch } from '@read-for-speed/ui/components/switch'
import { ToggleGroup, ToggleGroupItem } from '@read-for-speed/ui/components/toggle-group'
import { Info } from 'lucide-react'
import type { FontSizePreset, ReaderSettings } from './rsvp-reader'

interface SettingsPanelProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  onSave: () => void
  layout?: 'overlay' | 'page'
  /**
   * Ref to the font size control button
   */
  popoverAnchor?: HTMLElement | null
}

const MIN_WPM = 50
const MAX_WPM = 1000
const STEP_WPM = 25
const MIN_SKIP_WORDS = 1
const MAX_SKIP_WORDS = 100
const STEP_SKIP_WORDS = 1

/**
 * Font size preset options with display labels.
 */
const FONT_SIZE_PRESETS: { value: FontSizePreset; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
]

export function SettingsPanel({
  settings,
  onSettingsChange,
  onSave,
  layout = 'overlay',
  popoverAnchor,
}: SettingsPanelProps) {
  const isOverlay = layout === 'overlay'

  return (
    <div
      className={
        isOverlay
          ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          : 'flex-1 flex items-center justify-center'
      }
    >
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Font Family */}
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label htmlFor='font-family-input'>Font Family</Label>
              <p className='text-xs text-muted-foreground'>
                The font family to use for the reader.
              </p>
            </div>
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
          <Separator />

          {/* Font Size */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label
                htmlFor='font-size-input'
                className='text-sm font-medium'
              >
                Font Size
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      size='icon-xs'
                      variant='ghost'
                    />
                  }
                >
                  <Info />
                </PopoverTrigger>
                <PopoverPopup
                  side='top'
                  tooltipStyle
                  portalContainer={popoverAnchor}
                >
                  <PopoverTitle className='text-sm mb-3'>Font Size</PopoverTitle>
                  The font size is automatically calculated to fit the display width. Choose a
                  preset to adjust the relative size.
                </PopoverPopup>
              </Popover>
            </div>
            <ToggleGroup
              id='font-size-input'
              value={[settings.fontSizePreset]}
              onValueChange={(value) => {
                const nextValue = value[0]
                if (!nextValue) return
                onSettingsChange({
                  ...settings,
                  fontSizePreset: nextValue as FontSizePreset,
                })
              }}
              className='w-full'
              variant='outline'
            >
              {FONT_SIZE_PRESETS.map((preset) => (
                <ToggleGroupItem
                  key={preset.value}
                  value={preset.value}
                  className='flex-1'
                  style={{
                    fontSize:
                      preset.value === 'sm' ? '12px' : preset.value === 'md' ? '14px' : '16px',
                  }}
                  aria-label={preset.label}
                >
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reading Speed */}
          <div className='space-y-3'>
            <Label htmlFor='speed-input'>Default Speed: {settings.wpm} WPM</Label>
            <p className='text-xs text-muted-foreground'>
              The default speed when starting a new reading session.
            </p>
            <Slider
              id='speed-input'
              min={MIN_WPM}
              max={MAX_WPM}
              step={STEP_WPM}
              value={settings.wpm}
              onValueChange={(value) => onSettingsChange({ ...settings, wpm: value as number })}
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{MIN_WPM} (Slow)</span>
              <span>{MAX_WPM} (Fast)</span>
            </div>
          </div>

          {/* Skip words */}
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label
                htmlFor='skip-words-input'
                className='text-sm font-medium'
              >
                Word Skip Size: {settings.skipWords}
              </Label>
              <p className='text-xs text-muted-foreground'>
                The number of words to skip when using the skip buttons in the control panel.
              </p>
            </div>
            <Slider
              id='skip-words-input'
              min={MIN_SKIP_WORDS}
              max={MAX_SKIP_WORDS}
              step={STEP_SKIP_WORDS}
              value={settings.skipWords}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, skipWords: value as number })
              }
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{MIN_SKIP_WORDS}</span>
              <span>{MAX_SKIP_WORDS}</span>
            </div>
          </div>

          <Separator />

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
